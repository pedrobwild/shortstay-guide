import { describe, it, expect } from "vitest";
import { parseICalDate, isValidIcalUrl } from "../icalUtils";

// ============================================================
// Testes para parseICalDate
// ============================================================
describe("parseICalDate", () => {
  // --- Casos válidos ---
  it("converte data simples YYYYMMDD", () => {
    expect(parseICalDate("20250315")).toBe("2025-03-15");
  });

  it("converte data com prefixo VALUE=DATE:", () => {
    expect(parseICalDate("VALUE=DATE:20250101")).toBe("2025-01-01");
  });

  it("converte data com horário (ignora hora)", () => {
    expect(parseICalDate("20251231T120000Z")).toBe("2025-12-31");
  });

  it("converte data com prefixo TZID:", () => {
    expect(parseICalDate("TZID=America/Sao_Paulo:20250601")).toBe("2025-06-01");
  });

  // --- Casos inválidos ---
  it("retorna null para string vazia", () => {
    expect(parseICalDate("")).toBeNull();
  });

  it("retorna null para texto aleatório", () => {
    expect(parseICalDate("nao-e-data")).toBeNull();
  });

  it("retorna null para mês inválido (13)", () => {
    expect(parseICalDate("20251301")).toBeNull();
  });

  it("retorna null para mês zero", () => {
    expect(parseICalDate("20250001")).toBeNull();
  });

  it("retorna null para dia inválido (32)", () => {
    expect(parseICalDate("20250132")).toBeNull();
  });

  it("retorna null para dia zero", () => {
    expect(parseICalDate("20250100")).toBeNull();
  });
});

// ============================================================
// Testes para isValidIcalUrl
// ============================================================
describe("isValidIcalUrl", () => {
  // --- URLs válidas ---
  it("aceita URL HTTPS com .ics", () => {
    expect(isValidIcalUrl("https://www.airbnb.com/calendar/ical/123.ics?s=abc")).toBe(true);
  });

  it("aceita URL HTTPS com 'ical' no path", () => {
    expect(isValidIcalUrl("https://www.airbnb.com/calendar/ical/456")).toBe(true);
  });

  it("aceita URL HTTPS com 'ical' em query string", () => {
    expect(isValidIcalUrl("https://example.com/cal?type=ical")).toBe(true);
  });

  // --- URLs inválidas ---
  it("rejeita URL HTTP (sem S)", () => {
    expect(isValidIcalUrl("http://www.airbnb.com/calendar/ical/123.ics")).toBe(false);
  });

  it("rejeita URL sem protocolo", () => {
    expect(isValidIcalUrl("www.airbnb.com/calendar/ical/123.ics")).toBe(false);
  });

  it("rejeita string vazia", () => {
    expect(isValidIcalUrl("")).toBe(false);
  });

  it("rejeita texto aleatório", () => {
    expect(isValidIcalUrl("nao-e-url")).toBe(false);
  });

  it("rejeita URL HTTPS sem referência a ical ou .ics", () => {
    expect(isValidIcalUrl("https://www.google.com/")).toBe(false);
  });
});
