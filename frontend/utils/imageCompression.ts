/**
 * Compresses an image file using pure HTML5 Canvas API before uploading.
 * Reduces dimensions to max 1600px and converts to WebP (~80-85% quality).
 * If the browser doesn't support WebP or compression doesn't reduce size, returns original file.
 */
export async function compressImage(
    file: File,
    maxWidth = 1600,
    maxHeight = 1600,
    quality = 0.82
): Promise<File> {
    // Skip SVGs or tiny files (< 200 KB)
    if (file.type === 'image/svg+xml' || file.size < 200 * 1024) {
        return file;
    }

    return new Promise((resolve) => {
        const reader = new FileReader();

        reader.onload = (event) => {
            const img = new Image();

            img.onload = () => {
                let { width, height } = img;

                // Scale down keeping aspect ratio if dimensions exceed limits
                if (width > maxWidth || height > maxHeight) {
                    if (width > height) {
                        height = Math.round((height * maxWidth) / width);
                        width = maxWidth;
                    } else {
                        width = Math.round((width * maxHeight) / height);
                        height = maxHeight;
                    }
                }

                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    return resolve(file);
                }

                ctx.drawImage(img, 0, 0, width, height);

                canvas.toBlob(
                    (blob) => {
                        if (!blob || blob.size >= file.size) {
                            // Compression didn't make file smaller, keep original
                            return resolve(file);
                        }

                        const newFileName = file.name.replace(/\.[^.]+$/, '') + '.webp';
                        const compressedFile = new File([blob], newFileName, {
                            type: 'image/webp',
                            lastModified: Date.now(),
                        });

                        resolve(compressedFile);
                    },
                    'image/webp',
                    quality
                );
            };

            img.onerror = () => resolve(file);
            img.src = event.target?.result as string;
        };

        reader.onerror = () => resolve(file);
        reader.readAsDataURL(file);
    });
}
