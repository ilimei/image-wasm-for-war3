#include <stdarg.h>
#include <stdbool.h>
#include <stdint.h>
#include <stdlib.h>

typedef struct {
    int32_t width;
    int32_t height;
    int32_t len;
    const void* data;
} ImageData;

typedef struct {
    int32_t width;
    int32_t height;
    int32_t len;
    const void* data;
} ImageBoxData;

typedef enum {
    TGA,
    PNG,
} LibImageFormat;

ImageBoxData rust_encode_image(ImageData image_data, LibImageFormat format);
ImageBoxData rust_decode_image(ImageData image_data, LibImageFormat format);
