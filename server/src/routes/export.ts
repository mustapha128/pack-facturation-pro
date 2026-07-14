import { Router } from "express";
import PDFDocument from "pdfkit";
import { requireAuth, type AuthedRequest } from "../auth.js";
import { calculerFacture } from "../calc.js";
import type { DatabaseSync } from "node:sqlite";

export const exportRouter = Router();
exportRouter.use(requireAuth);

function getFactureAvecCalc(db: DatabaseSync, id: string) {
  const facture = db.prepare("SELECT f.*, c.nom as client_nom, c.email as client_email, c.adresse as client_adresse FROM factures f JOIN clients c ON c.id = f.client_id WHERE f.id = ?").get(id) as any;
  if (!facture) return null;
  const lignes = db.prepare("SELECT * FROM facture_lignes WHERE facture_id = ? ORDER BY ordre").all(id) as any[];
  const calc = calculerFacture(lignes, facture.remise_globale_pct);
  return { facture, calc };
}

exportRouter.get("/factures/:id/pdf", (req: AuthedRequest, res) => {
  const data = getFactureAvecCalc(req.db!, req.params.id);
  if (!data) return res.status(404).json({ error: "Facture introuvable" });
  const { facture, calc } = data;

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${facture.numero}.pdf"`);

  const doc = new PDFDocument({ margin: 50 });
  doc.pipe(res);

  doc.fontSize(20).fillColor("#1a1a1a").text("FACTURE", { align: "right" });
  doc.fontSize(10).fillColor("#555").text(facture.numero, { align: "right" });
  doc.moveDown(2);

  doc.fontSize(11).fillColor("#000").text(`Client : ${facture.client_nom}`);
  if (facture.client_email) doc.text(`Email : ${facture.client_email}`);
  if (facture.client_adresse) doc.text(`Adresse : ${facture.client_adresse}`);
  doc.text(`Date d'émission : ${facture.date_emission}`);
  if (facture.date_echeance) doc.text(`Échéance : ${facture.date_echeance}`);
  doc.text(`Statut : ${facture.statut}`);
  doc.moveDown(1.5);

  const tableTop = doc.y;
  doc.fontSize(10).fillColor("#fff");
  doc.rect(50, tableTop, 500, 20).fill("#0a0a0a");
  doc.fillColor("#d4af37");
  doc.text("Désignation", 55, tableTop + 5, { width: 180 });
  doc.text("Qté", 235, tableTop + 5, { width: 40 });
  doc.text("PU HT", 275, tableTop + 5, { width: 60 });
  doc.text("Remise", 335, tableTop + 5, { width: 50 });
  doc.text("TVA", 385, tableTop + 5, { width: 40 });
  doc.text("Total TTC", 425, tableTop + 5, { width: 80 });

  let y = tableTop + 25;
  doc.fillColor("#000");
  for (const l of calc.lignes) {
    doc.text(l.designation ?? "", 55, y, { width: 180 });
    doc.text(String(l.quantite), 235, y, { width: 40 });
    doc.text(`${l.prix_unitaire_ht.toFixed(2)} €`, 275, y, { width: 60 });
    doc.text(`${l.remise_pct}%`, 335, y, { width: 50 });
    doc.text(`${l.taux_tva}%`, 385, y, { width: 40 });
    doc.text(`${l.total_ttc.toFixed(2)} €`, 425, y, { width: 80 });
    y += 20;
  }

  y += 10;
  doc.moveTo(50, y).lineTo(550, y).strokeColor("#d4af37").stroke();
  y += 10;

  const totalsLine = (label: string, value: string, bold = false) => {
    doc.fontSize(bold ? 12 : 10).fillColor(bold ? "#0a0a0a" : "#333");
    doc.text(label, 350, y, { width: 120, align: "right" });
    doc.text(value, 470, y, { width: 80, align: "right" });
    y += bold ? 22 : 18;
  };

  totalsLine("Sous-total HT :", `${calc.sous_total_ht.toFixed(2)} €`);
  if (calc.remise_globale_pct > 0) {
    totalsLine(`Remise globale (${calc.remise_globale_pct}%) :`, `- ${calc.remise_globale_montant.toFixed(2)} €`);
  }
  totalsLine("Total HT :", `${calc.total_ht_apres_remise.toFixed(2)} €`);
  totalsLine("TVA :", `${calc.total_tva.toFixed(2)} €`);
  totalsLine("Total TTC :", `${calc.total_ttc.toFixed(2)} €`, true);

  if (facture.notes) {
    y += 20;
    doc.fontSize(10).fillColor("#555").text(`Notes : ${facture.notes}`, 50, y, { width: 500 });
  }

  doc.end();
});

function csvEscape(v: unknown): string {
  const s = String(v ?? "");
  return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

exportRouter.get("/factures/:id/csv", (req: AuthedRequest, res) => {
  const data = getFactureAvecCalc(req.db!, req.params.id);
  if (!data) return res.status(404).json({ error: "Facture introuvable" });
  const { facture, calc } = data;

  const rows = [
    ["Désignation", "Quantité", "PU HT", "Remise %", "TVA %", "Total HT net", "Total TTC"],
    ...calc.lignes.map((l) => [l.designation, l.quantite, l.prix_unitaire_ht, l.remise_pct, l.taux_tva, l.total_ht_net, l.total_ttc]),
    [],
    ["Sous-total HT", "", "", "", "", "", calc.sous_total_ht],
    ["Remise globale", "", "", "", "", "", calc.remise_globale_montant],
    ["Total HT", "", "", "", "", "", calc.total_ht_apres_remise],
    ["TVA", "", "", "", "", "", calc.total_tva],
    ["Total TTC", "", "", "", "", "", calc.total_ttc],
  ];

  const csv = rows.map((r) => r.map(csvEscape).join(";")).join("\n");
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${facture.numero}.csv"`);
  res.send("﻿" + csv);
});

exportRouter.get("/factures/csv", (req: AuthedRequest, res) => {
  const factures = req.db!
    .prepare("SELECT f.*, c.nom as client_nom FROM factures f JOIN clients c ON c.id = f.client_id ORDER BY f.date_emission DESC")
    .all() as any[];

  const rows = [["Numéro", "Client", "Date émission", "Échéance", "Statut", "Total HT", "TVA", "Total TTC"]];
  for (const f of factures) {
    const lignes = req.db!.prepare("SELECT * FROM facture_lignes WHERE facture_id = ?").all(f.id) as any[];
    const calc = calculerFacture(lignes, f.remise_globale_pct);
    rows.push([
      f.numero,
      f.client_nom,
      f.date_emission,
      f.date_echeance || "",
      f.statut,
      String(calc.total_ht_apres_remise),
      String(calc.total_tva),
      String(calc.total_ttc),
    ]);
  }

  const csv = rows.map((r) => r.map(csvEscape).join(";")).join("\n");
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="factures.csv"`);
  res.send("﻿" + csv);
});
