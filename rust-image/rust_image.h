#include <stdarg.h>
#include <stdbool.h>
#include <stdint.h>
#include <stdlib.h>

typedef struct RustLogMessage {
  int id;
  const char *msg;
} RustLogMessage;

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
    GIF,
} ImageFormat;


void rust_log(struct RustLogMessage msg);
ImageBoxData process_image(ImageData image_data, ImageFormat format);
