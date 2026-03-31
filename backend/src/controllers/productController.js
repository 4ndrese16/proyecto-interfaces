const { Product } = require('../models');

const validCategories = new Set(['telefono', 'accesorio']);

const parseBoolean = (value) => value === true || value === 'true' || value === 1 || value === '1';

const toImagePath = (file) => (file ? `/uploads/products/${file.filename}` : null);

const sanitizeText = (value, fallback = '') => {
	if (value === undefined || value === null) return fallback;
	return String(value).trim();
};

const normalizeCategory = (value) => {
	const normalized = sanitizeText(value).toLowerCase();
	if (normalized === 'telefonos') return 'telefono';
	if (normalized === 'accesorios') return 'accesorio';
	return normalized;
};

const parsePrice = (value) => {
	const num = Number(value);
	if (!Number.isFinite(num) || num < 0) return null;
	return Number(num.toFixed(2));
};

const parseDiscount = (value) => {
	const num = parseInt(value, 10);
	if (!Number.isFinite(num) || num < 0) return 0;
	if (num > 99) return 99;
	return num;
};

const parseVariants = (rawVariants, uploadedVariantFiles = []) => {
	if (!rawVariants) return [];

	let parsed;
	try {
		parsed = typeof rawVariants === 'string' ? JSON.parse(rawVariants) : rawVariants;
	} catch (_error) {
		throw new Error('El formato de variantes no es valido');
	}

	if (!Array.isArray(parsed)) {
		throw new Error('Las variantes deben enviarse en un arreglo');
	}

	return parsed
		.map((variant) => {
			const color_name = sanitizeText(variant.color_name);
			const color_hex = sanitizeText(variant.color_hex).toLowerCase();
			const imageIndex = parseInt(variant.image_index, 10);
			const imageFromUpload = Number.isFinite(imageIndex) ? uploadedVariantFiles[imageIndex] : null;

			if (!color_name) return null;

			if (color_hex && !/^#[0-9a-f]{6}$/i.test(color_hex)) {
				throw new Error(`Color hex invalido para variante ${color_name}`);
			}

			return {
				color_name,
				color_hex: color_hex || null,
				image_path: toImagePath(imageFromUpload) || sanitizeText(variant.image_path) || null
			};
		})
		.filter(Boolean);
};

const buildResponse = (product) => {
	const price = Number(product.price || 0);
	const discount = product.has_discount ? Number(product.discount_percentage || 0) : 0;
	const final_price = Number((price * (1 - discount / 100)).toFixed(2));

	return {
		...product.toJSON(),
		final_price
	};
};

exports.getAll = async (req, res) => {
	try {
		const { category, brand, include_inactive } = req.query;
		const where = {};

		if (!parseBoolean(include_inactive)) {
			where.is_active = true;
		}

		if (category) {
			const normalized = normalizeCategory(category);
			if (validCategories.has(normalized)) {
				where.category = normalized;
			}
		}

		if (brand) {
			where.brand = sanitizeText(brand);
		}

		const products = await Product.findAll({
			where,
			order: [['createdAt', 'DESC']]
		});

		return res.json(products.map(buildResponse));
	} catch (_error) {
		return res.status(500).json({ message: 'Error obteniendo productos' });
	}
};

exports.getById = async (req, res) => {
	try {
		const { id } = req.params;
		const product = await Product.findByPk(id);

		if (!product) {
			return res.status(404).json({ message: 'Producto no encontrado' });
		}

		return res.json(buildResponse(product));
	} catch (_error) {
		return res.status(500).json({ message: 'Error obteniendo producto' });
	}
};

exports.create = async (req, res) => {
	try {
		const name = sanitizeText(req.body.name);
		const description = sanitizeText(req.body.description);
		const category = normalizeCategory(req.body.category);
		const brand = sanitizeText(req.body.brand);
		const price = parsePrice(req.body.price);
		const is_new = parseBoolean(req.body.is_new);
		const has_discount = parseBoolean(req.body.has_discount);
		const discount_percentage = parseDiscount(req.body.discount_percentage);

		if (!name || !description || !brand || price === null) {
			return res.status(400).json({ message: 'Nombre, descripcion, marca y precio son obligatorios' });
		}

		if (!validCategories.has(category)) {
			return res.status(400).json({ message: 'Categoria invalida. Usa telefono o accesorio' });
		}

		if (has_discount && discount_percentage <= 0) {
			return res.status(400).json({ message: 'Si el producto tiene descuento, el porcentaje debe ser mayor a 0' });
		}

		const variants = parseVariants(req.body.variants, req.files?.variant_images || []);
		const main_image_path = toImagePath(req.files?.main_image?.[0]);

		const product = await Product.create({
			name,
			description,
			price,
			category,
			brand,
			is_new,
			has_discount,
			discount_percentage: has_discount ? discount_percentage : 0,
			main_image_path,
			variants
		});

		return res.status(201).json(buildResponse(product));
	} catch (error) {
		return res.status(500).json({ message: error.message || 'Error creando producto' });
	}
};

exports.update = async (req, res) => {
	try {
		const { id } = req.params;
		const product = await Product.findByPk(id);

		if (!product) {
			return res.status(404).json({ message: 'Producto no encontrado' });
		}

		const payload = {};

		if (req.body.name !== undefined) {
			const name = sanitizeText(req.body.name);
			if (!name) return res.status(400).json({ message: 'El nombre no puede estar vacio' });
			payload.name = name;
		}

		if (req.body.description !== undefined) {
			const description = sanitizeText(req.body.description);
			if (!description) return res.status(400).json({ message: 'La descripcion no puede estar vacia' });
			payload.description = description;
		}

		if (req.body.price !== undefined) {
			const price = parsePrice(req.body.price);
			if (price === null) return res.status(400).json({ message: 'Precio invalido' });
			payload.price = price;
		}

		if (req.body.category !== undefined) {
			const category = normalizeCategory(req.body.category);
			if (!validCategories.has(category)) {
				return res.status(400).json({ message: 'Categoria invalida. Usa telefono o accesorio' });
			}
			payload.category = category;
		}

		if (req.body.brand !== undefined) {
			const brand = sanitizeText(req.body.brand);
			if (!brand) return res.status(400).json({ message: 'Marca invalida' });
			payload.brand = brand;
		}

		if (req.body.is_new !== undefined) {
			payload.is_new = parseBoolean(req.body.is_new);
		}

		if (req.body.has_discount !== undefined) {
			payload.has_discount = parseBoolean(req.body.has_discount);
		}

		if (req.body.discount_percentage !== undefined) {
			payload.discount_percentage = parseDiscount(req.body.discount_percentage);
		}

		if (req.body.is_active !== undefined) {
			payload.is_active = parseBoolean(req.body.is_active);
		}

		const incomingMainImage = toImagePath(req.files?.main_image?.[0]);
		if (incomingMainImage) {
			payload.main_image_path = incomingMainImage;
		}

		if (req.body.variants !== undefined) {
			payload.variants = parseVariants(req.body.variants, req.files?.variant_images || []);
		}

		const hasDiscount = payload.has_discount !== undefined ? payload.has_discount : product.has_discount;
		const discount = payload.discount_percentage !== undefined ? payload.discount_percentage : product.discount_percentage;

		if (hasDiscount && discount <= 0) {
			return res.status(400).json({ message: 'Si el producto tiene descuento, el porcentaje debe ser mayor a 0' });
		}

		if (!hasDiscount) {
			payload.discount_percentage = 0;
		}

		await product.update(payload);
		return res.json(buildResponse(product));
	} catch (error) {
		return res.status(500).json({ message: error.message || 'Error actualizando producto' });
	}
};

exports.remove = async (req, res) => {
	try {
		const { id } = req.params;
		const product = await Product.findByPk(id);

		if (!product) {
			return res.status(404).json({ message: 'Producto no encontrado' });
		}

		await product.destroy();
		return res.json({ message: 'Producto eliminado' });
	} catch (_error) {
		return res.status(500).json({ message: 'Error eliminando producto' });
	}
};
