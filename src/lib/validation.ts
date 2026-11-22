export type FieldErrors = Record<string, string>;

export const isEmail = (value: string): boolean =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

export const normalizePhone = (value: string): string =>
  value.replace(/[\s-]/g, '').replace(/^0/, '62');

export const isValidIndonesianPhone = (value: string): boolean =>
  /^(62)?8\d{8,12}$/.test(normalizePhone(value).replace(/^62/, ''));

export const text = (formData: FormData, key: string): string => {
  const value = formData.get(key);
  return typeof value === 'string' ? value.trim() : '';
};

export const numberValue = (formData: FormData, key: string): number => {
  const raw = text(formData, key);
  // Input kosong harus dianggap tidak valid, bukan 0.
  if (!raw) return NaN;

  // Nilai dari CurrencyInput datang dalam format ribuan Indonesia (mis. 50.000).
  const normalized = /^\d{1,3}(\.\d{3})+([,.]\d+)?$/.test(raw)
    ? raw.replace(/\./g, '').replace(',', '.')
    : raw;
  const value = Number(normalized);
  return Number.isFinite(value) ? value : NaN;
};

export const validateRegistration = (formData: FormData): FieldErrors => {
  const errors: FieldErrors = {};
  const fullName = text(formData, 'fullName');
  const businessName = text(formData, 'businessName');
  const phone = text(formData, 'phone');
  const email = text(formData, 'email');
  const password = text(formData, 'password');

  if (fullName.length < 3) errors.fullName = 'Nama lengkap minimal 3 karakter.';
  if (businessName.length < 3) errors.businessName = 'Nama bisnis minimal 3 karakter.';
  if (!isValidIndonesianPhone(phone)) errors.phone = 'Nomor WhatsApp tidak valid (contoh: 81234567890).';
  if (!isEmail(email)) errors.email = 'Format email tidak valid.';
  if (password.length < 8) errors.password = 'Kata sandi minimal 8 karakter.';
  if (formData.get('terms') !== 'on' && formData.get('terms') !== 'true') {
    errors.terms = 'Anda harus menyetujui Ketentuan Layanan.';
  }

  return errors;
};

export const validateOrder = (formData: FormData): FieldErrors => {
  const errors: FieldErrors = {};
  if (text(formData, 'customerName').length < 2) errors.customerName = 'Nama pelanggan wajib diisi.';
  if (!isValidIndonesianPhone(text(formData, 'customerPhone'))) errors.customerPhone = 'Nomor WhatsApp tidak valid.';
  if (text(formData, 'productName').length < 2) errors.productName = 'Nama produk wajib diisi.';

  const quantity = numberValue(formData, 'quantity');
  if (!Number.isInteger(quantity) || quantity <= 0) errors.quantity = 'Quantity harus lebih dari 0.';

  const price = numberValue(formData, 'totalPrice');
  if (!Number.isFinite(price) || price < 0) errors.totalPrice = 'Total harga tidak boleh negatif.';

  const deadline = text(formData, 'deadline');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(deadline)) errors.deadline = 'Deadline wajib diisi.';

  const dp = numberValue(formData, 'initialPayment');
  if (!Number.isFinite(dp) || dp < 0) errors.initialPayment = 'Nominal DP tidak valid.';
  else if (dp > price) errors.initialPayment = 'DP tidak boleh melebihi total harga.';

  return errors;
};

export const validatePayment = (formData: FormData): FieldErrors => {
  const errors: FieldErrors = {};
  const amount = numberValue(formData, 'amount');
  if (!Number.isFinite(amount) || amount <= 0) errors.amount = 'Nominal harus lebih dari 0.';
  if (text(formData, 'paymentMethod').length < 2) errors.paymentMethod = 'Metode pembayaran wajib diisi.';
  return errors;
};
