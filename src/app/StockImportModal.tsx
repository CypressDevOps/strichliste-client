// src/app/StockImportModal.tsx
/**
 * Stock Import Modal
 * Mit echter OCR-Funktionalität mittels Tesseract.js
 */

import React, { useState, useEffect, useRef } from 'react';
import { createWorker } from 'tesseract.js';
import { createImportSession, updateImportSession, updateStock } from '../domain/stockService';
import { StockImportMatch } from '../domain/stockModels';
import { productService } from '../domain/productService';
import { ProductCategory, Product } from '../domain/models';

/**
 * Berechnet die Matcher-Score zwischen zwei Strings (Levenshtein-ähnlich)
 * Höhere Werte = bessere Matches
 */
function fuzzyMatchScore(input: string, productName: string): number {
  const inputLower = input.toLowerCase().trim();
  const nameLower = productName.toLowerCase().trim();

  // Exakter Match
  if (inputLower === nameLower) return 100;

  // Vorwärts-Match (z.B. "Stub" matched "Stubbi")
  if (nameLower.startsWith(inputLower)) return 90;

  // Enthält Match
  if (nameLower.includes(inputLower)) return 80;

  // Levenshtein-Distance für ähnliche Strings
  const maxLen = Math.max(inputLower.length, nameLower.length);
  const distance = levenshteinDistance(inputLower, nameLower);
  const similarity = 1 - distance / maxLen;
  return similarity * 70; // Max 70 für ähnliche aber nicht exakte Matches
}

function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

interface StockImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type ImportStep = 'upload' | 'manual_entry' | 'completed';

export const StockImportModal: React.FC<StockImportModalProps> = ({ isOpen, onClose }) => {
  const [step, setStep] = useState<ImportStep>('upload');

  // OCR State
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isOCRProcessing, setIsOCRProcessing] = useState(false);
  const [ocrRawText, setOcrRawText] = useState<string>('');
  const [ocrDebugInfo, setOcrDebugInfo] = useState<
    Array<{ line: string; bestMatch?: string; score?: number }>
  >([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Manual Entry
  const [productName, setProductName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [matches, setMatches] = useState<StockImportMatch[]>([]);

  // Kisten-Logik für Bestandsverwaltung
  const [packingUnit, setPackingUnit] = useState<'Einzelstück' | 'Kiste' | 'Karton' | 'Palette'>(
    'Einzelstück'
  );
  const [unitsPerPack, setUnitsPerPack] = useState('1');
  const [numberOfPacks, setNumberOfPacks] = useState('');

  // New Product Creation
  const [isCreatingNewProduct, setIsCreatingNewProduct] = useState(false);
  const [createForMatchIndex, setCreateForMatchIndex] = useState<number | null>(null);
  const [newProductCategory, setNewProductCategory] = useState<ProductCategory>('Bier');
  const [newProductPrice, setNewProductPrice] = useState<number>(1.0);

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const products = productService.loadProducts();

  const CATEGORIES: ProductCategory[] = [
    'Bier',
    'Alkoholfreie Getränke',
    'Schnaps',
    'Apfelwein / Sekt / Schaumwein',
    'Snacks',
  ];

  // Alle States beim Schließen der Modale zurücksetzen
  useEffect(() => {
    if (!isOpen) {
      setStep('upload');
      setMatches([]);
      setProductName('');
      setQuantity('');
      setSelectedProductId('');
      setMessage(null);
      setIsCreatingNewProduct(false);
      setCreateForMatchIndex(null);
      setNewProductCategory('Bier');
      setNewProductPrice(1.0);
      setPackingUnit('Einzelstück');
      setUnitsPerPack('1');
      setNumberOfPacks('');
      setImagePreview(null);
      setIsOCRProcessing(false);
      setOcrRawText('');
      setOcrDebugInfo([]);
    }
  }, [isOpen]);

  // OCR mit Tesseract.js
  const performOCR = async (imageData: string) => {
    setIsOCRProcessing(true);
    setMessage({ type: 'success', text: 'OCR-Verarbeitung läuft...' });

    try {
      const worker = await createWorker('deu');
      const {
        data: { text },
      } = await worker.recognize(imageData);
      await worker.terminate();

      // Speichere Roh-Text für Debug
      setOcrRawText(text);

      // Text-Analyse: Versuche Produkte und Mengen zu erkennen
      const lines = text.split('\n').filter((line) => line.trim().length > 0);
      const detectedMatches: StockImportMatch[] = [];
      const debugInfo: Array<{ line: string; bestMatch?: string; score?: number }> = [];

      const normalizeText = (value: string): string => {
        return value
          .toLowerCase()
          .replace(/\u00e4/g, 'ae')
          .replace(/\u00f6/g, 'oe')
          .replace(/\u00fc/g, 'ue')
          .replace(/\u00df/g, 'ss');
      };

      const productTokens = Array.from(
        new Set(
          products.flatMap((product) =>
            normalizeText(product.name)
              .replace(/[^a-z0-9\s]/g, ' ')
              .split(/\s+/)
              .map((token) => token.trim())
              .filter((token) => token.length >= 3)
          )
        )
      );

      const containsProductToken = (cleanedText: string): boolean => {
        const haystack = ` ${cleanedText} `;
        return productTokens.some((token) => haystack.includes(` ${token} `));
      };

      const isLikelyNoiseLine = (lineText: string): boolean => {
        const normalized = normalizeText(lineText);
        const cleaned = normalized
          .replace(/[^a-z0-9\s]/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
        if (!cleaned) return true;

        if (containsProductToken(cleaned)) return false;

        const alpha = cleaned.replace(/[^a-z]/g, '');
        const alphaCount = alpha.length;
        const digitCount = (cleaned.match(/\d/g) || []).length;
        const totalLen = cleaned.length;

        // Zu wenig Buchstaben oder zu viele Zahlen/Sonderzeichen
        if (alphaCount < 3) return true;
        if (digitCount > alphaCount * 2) return true;
        if (totalLen <= 2) return true;

        // Zeilen mit typischen Kassen-Keywords ignorieren
        const keywordPattern =
          /(\brueckgeld\b|\bruckgeld\b|\bpfand\b|\bfand\b|\bsumme\b|\btotal\b|\bgesamt\b|\bmwst\b|\bsteuer\b|\brabatt\b|\bbar\b|\bec\b|\bkarte\b|\beur\b|\beuro\b)/i;
        if (keywordPattern.test(cleaned)) return true;

        // Kurzzeilen mit lauter Einzelbuchstaben oder Fragmenten
        const tokens = cleaned.split(' ').filter(Boolean);
        const shortTokens = tokens.filter((t) => t.length <= 2).length;
        if (tokens.length > 0 && shortTokens / tokens.length > 0.6) return true;

        return false;
      };

      for (const line of lines) {
        const normalizedLine = normalizeText(line);
        const cleanedLine = normalizedLine
          .replace(/[^a-z0-9\s]/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
        const hasProductToken = containsProductToken(cleanedLine);
        const isIgnoredLine = /(\brueckgeld\b|\bruckgeld\b|\bpfand\b|\bfand\b)/i.test(
          normalizedLine
        );
        if ((isIgnoredLine && !hasProductToken) || isLikelyNoiseLine(line)) {
          debugInfo.push({ line });
          continue;
        }
        // Versuche Menge zu extrahieren (z.B. "24", "5x", "10 Stück")
        const qtyMatch = line.match(/(\d+)\s*(x|st|stück|stueck)?/i);
        const recognizedQty = qtyMatch ? parseInt(qtyMatch[1]) : 1;

        // Versuche Produktnamen zu finden
        const productNameMatch = line.replace(/\d+\s*(x|st|stück|stueck)?/gi, '').trim();

        if (productNameMatch.length < 2) continue; // Zu kurzer Text

        // Finde bestes Match in Produktliste
        // Strategie: Prüfe erst die ganze Zeile, dann einzelne Wörter
        let bestMatch: { product: Product; score: number } | null = null;

        // 1. Versuch: Ganze bereinigte Zeile matchen
        for (const product of products) {
          const score = fuzzyMatchScore(productNameMatch, product.name);
          if (score > 50 && (!bestMatch || score > bestMatch.score)) {
            bestMatch = { product, score };
          }
        }

        // 2. Versuch: Wenn kein guter Match, prüfe jedes Wort einzeln
        if (!bestMatch || bestMatch.score < 70) {
          const words = productNameMatch.split(/\s+/).filter((w) => w.length >= 3);
          for (const word of words) {
            for (const product of products) {
              const score = fuzzyMatchScore(word, product.name);
              if (score > 50 && (!bestMatch || score > bestMatch.score)) {
                bestMatch = { product, score };
              }
            }
          }
        }

        // Debug-Info speichern
        if (bestMatch) {
          debugInfo.push({
            line: line,
            bestMatch: bestMatch.product.name,
            score: Math.round(bestMatch.score),
          });
        } else {
          debugInfo.push({
            line: line,
          });
        }

        const hasMatch = !!(bestMatch && bestMatch.score > 50);

        detectedMatches.push({
          ocr_result: {
            product_name: productNameMatch,
            recognized_quantity: recognizedQty,
            confidence: hasMatch ? bestMatch!.score / 100 : 0,
            raw_text: line,
          },
          matched_product: hasMatch
            ? {
                product_id: bestMatch!.product.id,
                name: bestMatch!.product.name,
                match_type: bestMatch!.score > 90 ? 'name_exact' : 'name_fuzzy',
                match_score: bestMatch!.score / 100,
              }
            : undefined,
          action: {
            type: 'add',
            value: recognizedQty,
            unit: 'Stück',
          },
          is_confirmed: false,
          manual_product_id: hasMatch ? bestMatch!.product.id : undefined,
          packing_unit: 'Einzelstück',
          units_per_pack: undefined,
        });
      }

      setMatches(detectedMatches);
      setOcrDebugInfo(debugInfo);

      if (detectedMatches.length > 0) {
        const matchedCount = detectedMatches.filter((item) => item.manual_product_id).length;
        const unmatchedCount = detectedMatches.length - matchedCount;
        const summary = unmatchedCount > 0 ? ` (${unmatchedCount} ohne Match)` : '';

        setMessage({
          type: matchedCount > 0 ? 'success' : 'error',
          text: `✓ ${matchedCount} Artikel zugeordnet${summary}. Bitte prüfen und fehlende zuordnen.`,
        });
      } else {
        setMessage({
          type: 'error',
          text: `Keine Artikel automatisch zugeordnet. ${debugInfo.length} Zeilen erkannt - siehe unten für Details.`,
        });
      }

      setStep('manual_entry');
    } catch (error) {
      console.error('OCR Error:', error);
      setMessage({
        type: 'error',
        text: 'OCR-Fehler. Bitte versuchen Sie es erneut oder fügen Sie Artikel manuell hinzu.',
      });
      setStep('manual_entry');
    } finally {
      setIsOCRProcessing(false);
    }
  };

  const handleImageSelect = (file: File) => {
    if (!file) return;

    // Prüfe Dateityp
    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'error', text: 'Bitte wählen Sie eine Bilddatei aus.' });
      return;
    }

    // Vorschau erstellen
    const reader = new FileReader();
    reader.onload = (e) => {
      const imageData = e.target?.result as string;
      setImagePreview(imageData);
      performOCR(imageData);
    };
    reader.readAsDataURL(file);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleImageSelect(file);
  };

  const handleCameraCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleImageSelect(file);
  };

  const handleSkipOCR = () => {
    setStep('manual_entry');
  };

  const handleAddItem = () => {
    // Berechne Gesamtmenge basierend auf Verpackungseinheit
    let qty: number;
    let packsCount: number | undefined;
    if (packingUnit === 'Einzelstück') {
      if (!quantity.trim()) {
        setMessage({ type: 'error', text: 'Bitte Menge eingeben' });
        return;
      }
      qty = parseInt(quantity, 10);
      if (isNaN(qty) || qty <= 0) {
        setMessage({ type: 'error', text: 'Ungültige Menge eingegeben' });
        return;
      }
    } else {
      // Kisten/Karton/Palette
      if (!numberOfPacks.trim() || !unitsPerPack.trim()) {
        setMessage({
          type: 'error',
          text: 'Bitte Anzahl Verpackungen und Stück pro Verpackung eingeben',
        });
        return;
      }
      const packs = parseInt(numberOfPacks, 10);
      const perPack = parseInt(unitsPerPack, 10);
      if (isNaN(packs) || packs <= 0 || isNaN(perPack) || perPack <= 0) {
        setMessage({ type: 'error', text: 'Ungültige Anzahl eingegeben' });
        return;
      }
      packsCount = packs;
      qty = packs * perPack;
    }

    // Validiere dass entweder Produkt aus Liste oder Name eingegeben
    if (!selectedProductId && !productName.trim()) {
      setMessage({ type: 'error', text: 'Bitte Produkt auswählen oder Produktnamen eingeben' });
      return;
    }

    let matchedProductId = selectedProductId;
    let matchedProductName = productName.trim();

    // Fuzzy-Match falls kein Produkt ausgewählt aber Name eingegeben
    if (!matchedProductId && matchedProductName) {
      let bestScore = 0;
      let bestMatch = null;

      for (const product of products) {
        const score = fuzzyMatchScore(matchedProductName, product.name);
        if (score > bestScore && score >= 60) {
          bestScore = score;
          bestMatch = product;
        }
      }

      if (bestMatch) {
        matchedProductId = bestMatch.id;
        matchedProductName = bestMatch.name;
        setMessage({
          type: 'success',
          text: `✓ Produkt automatisch erkannt: ${bestMatch.name}`,
        });
      }
    } else if (matchedProductId && !matchedProductName) {
      // Wenn nur aus Dropdown ausgewählt, verwende den Produktnamen
      const product = products.find((p) => p.id === matchedProductId);
      if (product) {
        matchedProductName = product.name;
      }
    }

    // Validiere dass ein gültiges Produkt gefunden wurde
    if (!matchedProductId) {
      // Statt Fehler: Zeige Produkterstellungs-UI
      setIsCreatingNewProduct(true);
      setMessage({
        type: 'error',
        text: `Produkt "${matchedProductName}" nicht gefunden. Bitte Kategorie & Preis eingeben.`,
      });
      return;
    }

    const newMatch: StockImportMatch = {
      ocr_result: {
        product_name: matchedProductName,
        recognized_quantity: qty,
        confidence: matchedProductId ? 0.95 : 0.5,
        raw_text: `${matchedProductName} ${qty}`,
      },
      matched_product: matchedProductId
        ? {
            product_id: matchedProductId,
            name: matchedProductName,
            match_type: 'name_exact',
            match_score: 1.0,
          }
        : undefined,
      action: {
        type: 'add',
        value: qty,
        unit: 'Stück',
      },
      is_confirmed: false,
      manual_product_id: matchedProductId,
      packing_unit: packingUnit,
      units_per_pack: packingUnit !== 'Einzelstück' ? parseInt(unitsPerPack) : undefined,
      packs_count: packingUnit !== 'Einzelstück' ? packsCount : undefined,
    };

    setMatches([...matches, newMatch]);
    setProductName('');
    setQuantity('');
    setSelectedProductId('');
    setPackingUnit('Einzelstück');
    setUnitsPerPack('1');
    setNumberOfPacks('');
  };

  const handleCreateAndAddProduct = () => {
    if (!productName.trim()) {
      setMessage({ type: 'error', text: 'Produktname erforderlich' });
      return;
    }

    let qty: number;
    let packsCount: number | undefined;

    if (packingUnit === 'Einzelstück') {
      if (!quantity.trim()) {
        setMessage({ type: 'error', text: 'Menge erforderlich' });
        return;
      }

      qty = parseInt(quantity, 10);
      if (isNaN(qty) || qty <= 0) {
        setMessage({ type: 'error', text: 'Ungültige Menge' });
        return;
      }
    } else {
      if (!numberOfPacks.trim() || !unitsPerPack.trim()) {
        setMessage({
          type: 'error',
          text: 'Bitte Anzahl Verpackungen und Stück pro Verpackung eingeben',
        });
        return;
      }

      const packs = parseInt(numberOfPacks, 10);
      const perPack = parseInt(unitsPerPack, 10);
      if (isNaN(packs) || packs <= 0 || isNaN(perPack) || perPack <= 0) {
        setMessage({ type: 'error', text: 'Ungültige Anzahl' });
        return;
      }

      packsCount = packs;
      qty = packs * perPack;
    }

    if (newProductPrice <= 0) {
      setMessage({ type: 'error', text: 'Preis muss größer als 0 sein' });
      return;
    }

    // Erstelle neues Produkt
    const updatedProducts = productService.addProduct({
      name: productName.trim(),
      price: newProductPrice,
      icon: '',
      category: newProductCategory,
      isActive: true,
    });

    // Lade neu erstelltes Produkt
    const newProduct = updatedProducts[updatedProducts.length - 1];

    if (createForMatchIndex !== null) {
      setMatches((prev) =>
        prev.map((match, index) => {
          if (index !== createForMatchIndex) return match;

          return {
            ...match,
            ocr_result: {
              ...match.ocr_result,
              product_name: newProduct.name,
              recognized_quantity: qty,
              raw_text: `${newProduct.name} ${qty}`,
              confidence: 1.0,
            },
            matched_product: {
              product_id: newProduct.id,
              name: newProduct.name,
              match_type: 'name_exact',
              match_score: 1.0,
            },
            action: {
              ...match.action,
              value: qty,
              unit: 'Stück',
            },
            manual_product_id: newProduct.id,
            packing_unit: packingUnit,
            units_per_pack: packingUnit !== 'Einzelstück' ? parseInt(unitsPerPack, 10) : undefined,
            packs_count: packingUnit !== 'Einzelstück' ? packsCount : undefined,
          };
        })
      );

      setMessage({
        type: 'success',
        text: `✓ Produkt "${newProduct.name}" erstellt und zugeordnet`,
      });
      setCreateForMatchIndex(null);
    } else {
      // Füge zum Import hinzu
      const newMatch: StockImportMatch = {
        ocr_result: {
          product_name: newProduct.name,
          recognized_quantity: qty,
          confidence: 1.0,
          raw_text: `${newProduct.name} ${qty}`,
        },
        matched_product: {
          product_id: newProduct.id,
          name: newProduct.name,
          match_type: 'name_exact',
          match_score: 1.0,
        },
        action: {
          type: 'add',
          value: qty,
          unit: 'Stück',
        },
        is_confirmed: false,
        manual_product_id: newProduct.id,
        packing_unit: packingUnit,
        units_per_pack: packingUnit !== 'Einzelstück' ? parseInt(unitsPerPack, 10) : undefined,
        packs_count: packingUnit !== 'Einzelstück' ? packsCount : undefined,
      };

      setMatches([...matches, newMatch]);
      setMessage({
        type: 'success',
        text: `✓ Produkt "${newProduct.name}" erstellt und hinzugefügt`,
      });
    }

    // Reset
    setProductName('');
    setQuantity('');
    setIsCreatingNewProduct(false);
    setCreateForMatchIndex(null);
    setNewProductCategory('Bier');
    setNewProductPrice(1.0);
    setPackingUnit('Einzelstück');
    setUnitsPerPack('1');
    setNumberOfPacks('');
  };

  const handleCancelNewProduct = () => {
    setIsCreatingNewProduct(false);
    setCreateForMatchIndex(null);
    setProductName('');
    setQuantity('');
    setNewProductCategory('Bier');
    setNewProductPrice(1.0);
    setPackingUnit('Einzelstück');
    setUnitsPerPack('1');
    setNumberOfPacks('');
    setMessage(null);
  };

  const handleRemoveItem = (index: number) => {
    setMatches(matches.filter((_, i) => i !== index));
  };

  const handleCreateFromMatch = (match: StockImportMatch, index: number) => {
    setCreateForMatchIndex(index);
    setIsCreatingNewProduct(true);
    setSelectedProductId('');
    setProductName(match.ocr_result.product_name || '');

    const nextPackingUnit = match.packing_unit ?? 'Einzelstück';
    setPackingUnit(nextPackingUnit);

    if (nextPackingUnit === 'Einzelstück') {
      setQuantity(match.action.value.toString());
      setUnitsPerPack('1');
      setNumberOfPacks('');
    } else {
      const unitsPerPackValue = match.units_per_pack ?? 1;
      const packsValue =
        match.packs_count ?? Math.max(0, Math.round(match.action.value / unitsPerPackValue));
      setUnitsPerPack(unitsPerPackValue.toString());
      setNumberOfPacks(packsValue.toString());
      setQuantity('');
    }
  };

  const handleUpdateMatch = (
    index: number,
    updates: {
      quantity?: number;
      packs?: number;
      packingUnit?: 'Einzelstück' | 'Kiste' | 'Karton' | 'Palette';
      unitsPerPack?: number | null;
      productId?: string;
    }
  ) => {
    setMatches((prev) =>
      prev.map((match, i) => {
        if (i !== index) return match;

        const currentPackingUnit = match.packing_unit ?? 'Einzelstück';
        const currentUnitsPerPack = match.units_per_pack ?? 1;
        const currentPacks =
          match.packs_count ??
          (currentPackingUnit === 'Einzelstück'
            ? 0
            : Math.max(0, Math.round(match.action.value / currentUnitsPerPack)));

        const nextPackingUnit =
          updates.packingUnit !== undefined ? updates.packingUnit : currentPackingUnit;
        const nextUnitsPerPack =
          updates.unitsPerPack !== undefined
            ? (updates.unitsPerPack ?? undefined)
            : match.units_per_pack;

        const safeUnitsPerPack = nextUnitsPerPack && nextUnitsPerPack > 0 ? nextUnitsPerPack : 1;

        let nextPacksCount = currentPacks;
        if (updates.packs !== undefined) {
          nextPacksCount = updates.packs;
        } else if (updates.quantity !== undefined && nextPackingUnit !== 'Einzelstück') {
          nextPacksCount = updates.quantity;
        }

        let nextQuantity = match.action.value;
        if (nextPackingUnit === 'Einzelstück') {
          if (updates.quantity !== undefined) {
            nextQuantity = updates.quantity;
          }
          nextPacksCount = 0;
        } else if (updates.quantity !== undefined || updates.packs !== undefined) {
          nextQuantity = nextPacksCount * safeUnitsPerPack;
        } else if (updates.unitsPerPack !== undefined) {
          nextQuantity = nextPacksCount * safeUnitsPerPack;
        }

        const nextProduct = updates.productId
          ? products.find((p) => p.id === updates.productId) || null
          : null;

        return {
          ...match,
          action:
            updates.quantity !== undefined ||
            updates.packs !== undefined ||
            updates.unitsPerPack !== undefined
              ? { ...match.action, value: nextQuantity }
              : match.action,
          packing_unit: nextPackingUnit,
          units_per_pack: nextUnitsPerPack,
          packs_count: nextPackingUnit === 'Einzelstück' ? undefined : nextPacksCount,
          manual_product_id:
            updates.productId !== undefined
              ? updates.productId || undefined
              : match.manual_product_id,
          matched_product:
            updates.productId !== undefined
              ? nextProduct
                ? {
                    product_id: nextProduct.id,
                    name: nextProduct.name,
                    match_type: 'name_exact',
                    match_score: 1.0,
                  }
                : undefined
              : match.matched_product,
        };
      })
    );
  };

  const handleConfirmImport = async () => {
    if (matches.length === 0) {
      setMessage({ type: 'error', text: 'Keine Artikel zum Importieren' });
      return;
    }

    setIsProcessing(true);

    try {
      const session = createImportSession();

      // Batch-Update durchführen
      let successCount = 0;
      for (const match of matches) {
        if (match.manual_product_id) {
          const success = updateStock(
            match.manual_product_id,
            match.action.type,
            match.action.value,
            undefined,
            'Bestandsimport',
            match.packing_unit,
            match.units_per_pack,
            match.packs_count
          );
          if (success) successCount++;
        }
      }

      updateImportSession(session.id, {
        status: 'completed',
      });

      // Triggere UI-Refresh in anderen Modalen
      window.dispatchEvent(new Event('stock-updated'));

      setMessage({
        type: 'success',
        text: `Import erfolgreich: ${successCount} Artikel aktualisiert`,
      });

      setStep('completed');
      setTimeout(() => {
        onClose();
        setStep('manual_entry');
        setMatches([]);
      }, 2000);
    } catch (
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      error
    ) {
      setMessage({ type: 'error', text: 'Fehler beim Import' });
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className='fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4'>
      <div className='bg-gray-800 rounded-lg shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col'>
        {/* Header */}
        <div className='sticky top-0 bg-gray-800 border-b border-gray-700 px-6 py-4 flex justify-between items-center'>
          <h2 className='text-2xl font-bold text-white flex items-center gap-2'>
            📸 Bestand importieren
          </h2>
          <button
            onClick={onClose}
            className='text-gray-400 hover:text-white text-3xl leading-none'
            disabled={isProcessing}
          >
            &times;
          </button>
        </div>

        {/* Message */}
        {message && (
          <div
            className={`px-6 py-3 ${
              message.type === 'success' ? 'bg-green-900 text-green-200' : 'bg-red-900 text-red-200'
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Content */}
        <div className='flex-1 overflow-auto px-6 py-6'>
          {/* Upload Step */}
          {step === 'upload' && (
            <div className='space-y-6'>
              <div className='text-center'>
                <h3 className='text-xl font-semibold text-white mb-2'>
                  📸 Lieferschein oder Rechnung scannen
                </h3>
                <p className='text-gray-400 text-sm'>
                  Verwenden Sie OCR, um Artikel automatisch zu erkennen, oder fügen Sie diese
                  manuell hinzu.
                </p>
              </div>

              {/* Hidden File Inputs */}
              <input
                ref={fileInputRef}
                type='file'
                accept='image/*'
                onChange={handleFileUpload}
                className='hidden'
              />
              <input
                ref={cameraInputRef}
                type='file'
                accept='image/*'
                capture='environment'
                onChange={handleCameraCapture}
                className='hidden'
              />

              {/* Image Preview */}
              {imagePreview && (
                <div className='bg-gray-750 rounded-lg p-4'>
                  <img
                    src={imagePreview}
                    alt='Vorschau'
                    className='w-full max-h-96 object-contain rounded'
                  />
                  {isOCRProcessing && (
                    <div className='mt-4 text-center'>
                      <div className='inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500'></div>
                      <p className='text-white mt-2'>OCR-Verarbeitung läuft...</p>
                    </div>
                  )}
                </div>
              )}

              {/* Upload Buttons */}
              {!imagePreview && !isOCRProcessing && (
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <button
                    onClick={() => cameraInputRef.current?.click()}
                    className='flex items-center justify-center gap-3 px-6 py-8 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition font-semibold text-lg'
                  >
                    <span className='text-3xl'>📷</span>
                    <span>Kamera öffnen</span>
                  </button>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className='flex items-center justify-center gap-3 px-6 py-8 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition font-semibold text-lg'
                  >
                    <span className='text-3xl'>📁</span>
                    <span>Datei hochladen</span>
                  </button>
                </div>
              )}

              {/* Skip OCR Button */}
              <div className='text-center'>
                <button
                  onClick={handleSkipOCR}
                  disabled={isOCRProcessing}
                  className='px-6 py-3 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-800 disabled:cursor-not-allowed text-white rounded-lg transition'
                >
                  Artikel manuell hinzufügen
                </button>
              </div>
            </div>
          )}

          {step === 'manual_entry' && (
            <div className='space-y-4'>
              <h3 className='text-lg font-semibold text-white mb-4'>
                Artikel hinzufügen und Import bestätigen
              </h3>

              {/* Erkannte Artikel */}
              {matches.length > 0 && (
                <div className='bg-green-900/30 border border-green-700 rounded-lg p-4 space-y-3'>
                  <h4 className='text-green-300 font-semibold flex items-center gap-2'>
                    ✓ Erkannte Artikel ({matches.length})
                  </h4>
                  <div className='space-y-2 max-h-48 overflow-y-auto'>
                    {matches.map((match, idx) => (
                      <div
                        key={idx}
                        className='bg-gray-750 p-3 rounded flex justify-between items-center hover:bg-gray-700 transition'
                      >
                        <div className='flex-1 text-sm'>
                          <p className='text-white font-semibold'>
                            {match.matched_product?.name || match.ocr_result.product_name}
                          </p>
                          {!match.manual_product_id && (
                            <div className='mt-1'>
                              <label className='block text-[11px] text-red-300 mb-1'>
                                Kein Match - bitte Produkt zuordnen
                              </label>
                              <select
                                value={match.manual_product_id ?? ''}
                                onChange={(e) =>
                                  handleUpdateMatch(idx, {
                                    productId: e.target.value || undefined,
                                  })
                                }
                                className='w-full px-2 py-1 bg-gray-800 text-white rounded border border-red-700 text-xs'
                              >
                                <option value=''>-- Produkt auswählen --</option>
                                {products.map((product) => (
                                  <option key={product.id} value={product.id}>
                                    {product.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}
                          <p className='text-gray-400 text-xs'>
                            {match.action.type === 'add' ? '+' : ''}
                            {match.action.value} {match.action.unit} (Vertrauen:{' '}
                            {Math.round(match.ocr_result.confidence * 100)}%)
                          </p>
                          <div className='mt-2 grid grid-cols-1 md:grid-cols-3 gap-2 text-xs'>
                            <div>
                              <label className='block text-gray-400 mb-1'>
                                {(match.packing_unit ?? 'Einzelstück') === 'Einzelstück'
                                  ? 'Menge (Stück)'
                                  : 'Verpackungen'}
                              </label>
                              <input
                                type='number'
                                min='0'
                                value={
                                  (match.packing_unit ?? 'Einzelstück') === 'Einzelstück'
                                    ? match.action.value
                                    : (match.packs_count ??
                                      (match.units_per_pack
                                        ? Math.max(
                                            0,
                                            Math.round(match.action.value / match.units_per_pack)
                                          )
                                        : 0))
                                }
                                onChange={(e) => {
                                  const nextValue = parseInt(e.target.value, 10);
                                  handleUpdateMatch(idx, {
                                    quantity: Number.isNaN(nextValue) ? 0 : nextValue,
                                  });
                                }}
                                className='w-full px-2 py-1 bg-gray-800 text-white rounded border border-gray-600'
                              />
                              {(match.packing_unit ?? 'Einzelstück') !== 'Einzelstück' && (
                                <p className='text-gray-400 text-[11px] mt-1'>
                                  Gesamt: {match.action.value} Stück
                                </p>
                              )}
                            </div>
                            <div>
                              <label className='block text-gray-400 mb-1'>Verpackung</label>
                              <select
                                value={match.packing_unit ?? 'Einzelstück'}
                                onChange={(e) => {
                                  const nextUnit = e.target.value as
                                    | 'Einzelstück'
                                    | 'Kiste'
                                    | 'Karton'
                                    | 'Palette';
                                  handleUpdateMatch(idx, {
                                    packingUnit: nextUnit,
                                    unitsPerPack:
                                      nextUnit === 'Einzelstück'
                                        ? null
                                        : (match.units_per_pack ?? 1),
                                  });
                                }}
                                className='w-full px-2 py-1 bg-gray-800 text-white rounded border border-gray-600'
                              >
                                <option value='Einzelstück'>Einzelstück</option>
                                <option value='Kiste'>Kiste</option>
                                <option value='Karton'>Karton</option>
                                <option value='Palette'>Palette</option>
                              </select>
                            </div>
                            {(match.packing_unit ?? 'Einzelstück') !== 'Einzelstück' && (
                              <div>
                                <label className='block text-gray-400 mb-1'>
                                  Stück pro Verpackung
                                </label>
                                <input
                                  type='number'
                                  min='1'
                                  value={match.units_per_pack ?? ''}
                                  onChange={(e) => {
                                    const nextValue = parseInt(e.target.value, 10);
                                    handleUpdateMatch(idx, {
                                      unitsPerPack:
                                        Number.isNaN(nextValue) || nextValue <= 0
                                          ? null
                                          : nextValue,
                                    });
                                  }}
                                  className='w-full px-2 py-1 bg-gray-800 text-white rounded border border-gray-600'
                                />
                              </div>
                            )}
                          </div>
                        </div>
                        <div className='flex flex-col items-end gap-2'>
                          {!match.manual_product_id && (
                            <button
                              type='button'
                              onClick={() => handleCreateFromMatch(match, idx)}
                              className='px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs'
                            >
                              Neues Produkt
                            </button>
                          )}
                          <button
                            type='button'
                            onClick={() => handleRemoveItem(idx)}
                            className='px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm transition'
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* OCR Debug Info - zeigt was erkannt wurde */}
              {ocrDebugInfo.length > 0 && (
                <div className='bg-yellow-900/20 border border-yellow-700 rounded-lg p-4 space-y-3'>
                  <h4 className='text-yellow-300 font-semibold flex items-center gap-2'>
                    🔍 OCR-Erkennungsdetails ({ocrDebugInfo.length} Zeilen)
                  </h4>
                  <div className='space-y-1 max-h-64 overflow-y-auto text-xs'>
                    {ocrDebugInfo.map((info, idx) => (
                      <div key={idx} className='bg-gray-800/50 p-2 rounded'>
                        <div className='flex justify-between items-start gap-2'>
                          <p className='text-white font-mono flex-1'>"{info.line}"</p>
                          {info.bestMatch ? (
                            <div className='text-right'>
                              <p className='text-green-400'>→ {info.bestMatch}</p>
                              <p className='text-gray-400'>Score: {info.score}%</p>
                            </div>
                          ) : (
                            <p className='text-red-400'>Kein Match</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  {ocrRawText && (
                    <details className='mt-2'>
                      <summary className='text-yellow-300 cursor-pointer hover:text-yellow-200'>
                        Kompletter OCR-Text anzeigen
                      </summary>
                      <pre className='text-gray-300 text-xs mt-2 p-2 bg-gray-900 rounded overflow-auto max-h-48'>
                        {ocrRawText}
                      </pre>
                    </details>
                  )}
                </div>
              )}

              {/* Artikel hinzufügen */}
              <div className='bg-gray-750 p-4 rounded-lg space-y-3'>
                <h4 className='text-white font-semibold'>Artikel hinzufügen</h4>

                {!isCreatingNewProduct ? (
                  // Normale Eingabe: Produkt aus Liste wählen oder Name eingeben
                  <>
                    <div>
                      <label className='block text-sm text-gray-300 mb-1'>Produkt wählen</label>
                      <select
                        value={selectedProductId}
                        onChange={(e) => setSelectedProductId(e.target.value)}
                        className='w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600'
                      >
                        <option value=''>-- Aus Liste wählen --</option>
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className='block text-sm text-gray-300 mb-1'>
                        Verpackungseinheit *
                      </label>
                      <select
                        value={packingUnit}
                        onChange={(e) =>
                          setPackingUnit(
                            e.target.value as 'Einzelstück' | 'Kiste' | 'Karton' | 'Palette'
                          )
                        }
                        className='w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600'
                      >
                        <option value='Einzelstück'>Einzelstück</option>
                        <option value='Kiste'>Kiste (z.B. 24er Kiste Bier)</option>
                        <option value='Karton'>Karton</option>
                        <option value='Palette'>Palette</option>
                      </select>
                    </div>

                    {packingUnit === 'Einzelstück' ? (
                      <div>
                        <label className='block text-sm text-gray-300 mb-1'>Menge *</label>
                        <input
                          type='number'
                          placeholder='Anzahl Stück'
                          value={quantity}
                          onChange={(e) => setQuantity(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleAddItem()}
                          min='1'
                          className='w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600'
                        />
                      </div>
                    ) : (
                      <>
                        <div className='grid grid-cols-2 gap-3'>
                          <div>
                            <label className='block text-sm text-gray-300 mb-1'>
                              Anzahl {packingUnit} *
                            </label>
                            <input
                              type='number'
                              placeholder={`z.B. 5`}
                              value={numberOfPacks}
                              onChange={(e) => setNumberOfPacks(e.target.value)}
                              min='1'
                              className='w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600'
                            />
                          </div>
                          <div>
                            <label className='block text-sm text-gray-300 mb-1'>
                              Stück pro {packingUnit} *
                            </label>
                            <input
                              type='number'
                              placeholder='z.B. 24'
                              value={unitsPerPack}
                              onChange={(e) => setUnitsPerPack(e.target.value)}
                              min='1'
                              className='w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600'
                            />
                          </div>
                        </div>
                        {numberOfPacks && unitsPerPack && (
                          <div className='text-sm text-green-400 bg-green-900/30 px-3 py-2 rounded border border-green-700'>
                            ✓ Gesamtmenge: {parseInt(numberOfPacks) * parseInt(unitsPerPack)} Stück
                            <span className='text-gray-400'>
                              {' '}
                              ({numberOfPacks} × {unitsPerPack})
                            </span>
                          </div>
                        )}
                      </>
                    )}

                    <div>
                      <label className='block text-sm text-gray-300 mb-1'>
                        Oder Produktname eingeben (optional)
                      </label>
                      <input
                        type='text'
                        placeholder='Produktname - wird automatisch gematcht'
                        value={productName}
                        onChange={(e) => setProductName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddItem()}
                        className='w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 text-sm'
                      />
                    </div>

                    <button
                      onClick={handleAddItem}
                      className='w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-semibold transition'
                    >
                      ➕ Artikel hinzufügen
                    </button>
                  </>
                ) : (
                  // Neues Produkt erstellen
                  <div className='space-y-3 bg-gray-800 p-4 rounded-lg border-2 border-yellow-500'>
                    <h5 className='text-md font-semibold text-yellow-400'>
                      🆕 Neues Produkt erstellen
                    </h5>

                    <div>
                      <label className='block text-sm text-gray-300 mb-1'>Produktname *</label>
                      <input
                        type='text'
                        value={productName}
                        onChange={(e) => setProductName(e.target.value)}
                        className='w-full px-3 py-2 bg-gray-900 text-white rounded border border-gray-600'
                        placeholder='z.B. Nuts'
                      />
                    </div>

                    <div>
                      <label className='block text-sm text-gray-300 mb-1'>Kategorie *</label>
                      <select
                        value={newProductCategory}
                        onChange={(e) => setNewProductCategory(e.target.value as ProductCategory)}
                        className='w-full px-3 py-2 bg-gray-900 text-white rounded border border-gray-600'
                      >
                        {CATEGORIES.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className='block text-sm text-gray-300 mb-1'>Preis (€) *</label>
                      <input
                        type='number'
                        step='0.1'
                        min='0.1'
                        value={newProductPrice}
                        onChange={(e) => setNewProductPrice(parseFloat(e.target.value) || 0)}
                        className='w-full px-3 py-2 bg-gray-900 text-white rounded border border-gray-600'
                        placeholder='1.00'
                      />
                    </div>

                    <div></div>

                    <div className='flex gap-2'>
                      <button
                        onClick={handleCreateAndAddProduct}
                        className='flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded font-semibold transition'
                      >
                        ✓ Produkt erstellen & hinzufügen
                      </button>
                      <button
                        onClick={handleCancelNewProduct}
                        className='px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded transition'
                      >
                        Abbrechen
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {step === 'completed' && (
            <div className='text-center py-8'>
              <div className='text-5xl mb-4'>✅</div>
              <h3 className='text-2xl font-bold text-green-400 mb-2'>Import erfolgreich!</h3>
              <p className='text-gray-300'>{matches.length} Artikel wurden aktualisiert</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className='sticky bottom-0 bg-gray-800 border-t border-gray-700 px-6 py-4 flex gap-3 justify-end'>
          <button
            onClick={onClose}
            className='px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded font-semibold transition'
            disabled={isProcessing}
          >
            Abbrechen
          </button>

          {step === 'manual_entry' && (
            <button
              onClick={handleConfirmImport}
              className='px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded font-semibold transition disabled:opacity-50'
              disabled={isProcessing || matches.length === 0}
            >
              {isProcessing ? 'Wird verarbeitet...' : '✓ Import bestätigen'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
