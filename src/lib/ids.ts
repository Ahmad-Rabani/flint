import { nanoid } from "nanoid";

export function orderNumber(prefix = "FL") {
  const date = new Date();
  const stamp = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}`;
  return `${prefix}-${stamp}-${nanoid(6).toUpperCase()}`;
}

export function receiptNumber() {
  return orderNumber("POS");
}

export function customOrderNumber() {
  return orderNumber("CUS");
}

export function quotationNumber() {
  return orderNumber("QT");
}

export function paymentNumber() {
  return orderNumber("PAY");
}
