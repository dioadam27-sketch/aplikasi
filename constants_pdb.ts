export const TIME_SLOTS = [
  "09:00 - 11:00",
  "10:00 - 12:00",
  "11:00 - 13:00",
  "12:00 - 14:00",
  "13:00 - 15:00",
  "14:00 - 16:00"
];

export const SUBJECTS = [
  { code: "UAK25000005", name: "Agama Buddha 1" },
  { code: "UAK25000004", name: "Agama Hindu 1" },
  { code: "UAK25000012", name: "Pengembangan Diri Kewirausahaan" },
  { code: "UAK25000011", name: "Logika dan Pemikiran Kritis" },
  { code: "UAK25000008", name: "Kewarganegaraan" },
  { code: "UAK25000007", name: "Pancasila" },
  { code: "UAK25000003", name: "Agama Kristen Katolik 1" },
  { code: "UAK25000002", name: "Agama Kristen Protestan 1" },
  { code: "UAK25000009", name: "Bahasa Indonesia" },
  { code: "UAK25000001", name: "Agama Islam I" },
  { code: "UAR25000001", name: "Etika dan Hukum Kesehatan" },
  { code: "UAR25000002", name: "Komunikasi Kesehatan dan Layanan Dasar Kesehatan" },
  { code: "UAK25000013", name: "Inovasi dan Kolaborasi Bisnis" },
  { code: "UAK25000010", name: "Data dan Pustaka" }
];

// Generate PDB Classes from PDB-01 to PDB-60
export const PDB_CLASSES = Array.from({ length: 125 }, (_, i) => {
  const num = i + 1;
  return `PDB-${num < 10 ? '0' + num : num}`;
});