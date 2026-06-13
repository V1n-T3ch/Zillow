export const toNumber = (value) => {
    if (typeof value === 'number' && Number.isFinite(value)) {
        return value;
    }

    if (typeof value === 'string') {
        const parsed = Number.parseFloat(value.replace(/[^0-9.-]/g, ''));
        return Number.isFinite(parsed) ? parsed : 0;
    }

    return 0;
};

export const toBedsCount = (value) => {
    if (typeof value === 'number' && Number.isFinite(value)) {
        return Math.floor(value);
    }

    if (typeof value === 'string') {
        const parsed = Number.parseInt(value, 10);
        return Number.isFinite(parsed) ? parsed : 0;
    }

    return 0;
};

export const normalizeImageList = (images, fallback = '') => {
    const list = Array.isArray(images) ? images : images ? [images] : [];

    const normalized = list
        .map((item) => {
            if (typeof item === 'string') {
                return item;
            }

            if (item && typeof item === 'object') {
                return item.url || item.src || item.imageUrl || '';
            }

            return '';
        })
        .filter(Boolean);

    if (normalized.length > 0) {
        return normalized;
    }

    return fallback ? [fallback] : [];
};

export const normalizeVideoList = (videos) => {
    const list = Array.isArray(videos) ? videos : videos ? [videos] : [];

    return list
        .map((item) => {
            if (typeof item === 'string') {
                return { url: item, poster: '' };
            }

            if (item && typeof item === 'object' && item.url) {
                return { url: item.url, poster: item.poster || '' };
            }

            return null;
        })
        .filter(Boolean);
};

export const normalizeProperty = (property) => {
    const images = normalizeImageList(property?.images, property?.imageUrl);
    const videos = normalizeVideoList(property?.videos);

    return {
        ...property,
        title: property?.title || 'Untitled Property',
        propertyType: property?.propertyType || 'Property',
        status: typeof property?.status === 'string' ? property.status.trim().toLowerCase() : 'active',
        beds: toBedsCount(property?.beds),
        baths: toNumber(property?.baths),
        price: toNumber(property?.price),
        images,
        videos,
        imageUrl: images[0] || property?.imageUrl || 'https://placehold.co/800x500?text=No+Image'
    };
};