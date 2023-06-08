#define _POSIX_C_SOURCE 200809L
/*
 * Copyright 2011 The Emscripten Authors.  All rights reserved.
 * Emscripten is available under two separate licenses, the MIT license and the
 * University of Illinois/NCSA Open Source License.  Both these licenses can be
 * found in the LICENSE file.
 */

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <setjmp.h>
#include "jpeglib.h"
#include "rust_image.h"

typedef unsigned int uint32_t;

struct basic_jpeg_error_mgr {
    struct jpeg_error_mgr handler;
    char msg_str[JMSG_LENGTH_MAX];

    jmp_buf setjmp_buffer;
};

void handle_exit(j_common_ptr cinfo) {
  struct basic_jpeg_error_mgr* perr = (struct basic_jpeg_error_mgr *)cinfo->err;

  (*(cinfo->err->format_message)) (cinfo, perr->msg_str);

  longjmp(perr->setjmp_buffer, 1);
}

/**
 * Encodes an RGBA-buffer to a JPEG.
 *
 * @param rgb_buffer An RGBA image.
 * @param rgb_width Width of the image, pixels.
 * @param rgb_height Height of the image, pixels.
 * @param quality Quality: 0-100.
 * @param out_buffer Encoded image (JPEG) [must be freed by the called via `free`].
 * @param out_size Size of the encoded image, bytes.
 * @param out_msg An error message, if any [must be freed by the caller via `free`].
 * @return 0 if there is no error, otherwise a error code, see 'jerror.h' for details.
 */
extern int encode_jpeg(unsigned char* rgb_buffer, unsigned int rgb_width, unsigned int rgb_height, int quality, unsigned char **out_buffer, unsigned int *out_size, char **out_msg)
{
  unsigned char* out_buffer_ret = NULL;
  unsigned long out_size_ret = 0;

  struct jpeg_compress_struct cinfo;

  struct basic_jpeg_error_mgr jerr;
  cinfo.err = jpeg_std_error(&jerr.handler);
  jerr.handler.error_exit = handle_exit;
  if (setjmp(jerr.setjmp_buffer)) {
    int result = jerr.handler.msg_code;
    *out_msg = strdup(jerr.msg_str);

    jpeg_destroy_compress(&cinfo);

    if(out_buffer_ret) {
      free(out_buffer_ret);
    }

    return result;
  }

  jpeg_create_compress(&cinfo);

  cinfo.image_width = rgb_width;
  cinfo.image_height = rgb_height;
  cinfo.input_components = 4;
  cinfo.in_color_space = JCS_UNKNOWN;

  jpeg_set_defaults(&cinfo);

  jpeg_set_quality(&cinfo, quality, TRUE);

  jpeg_mem_dest(&cinfo, &out_buffer_ret, &out_size_ret);

  jpeg_start_compress(&cinfo, TRUE);

  JSAMPROW row_pointer[1];
  int row_stride = rgb_width * 4;
  while (cinfo.next_scanline < cinfo.image_height) {
    row_pointer[0] = &rgb_buffer[cinfo.next_scanline * row_stride];
    jpeg_write_scanlines(&cinfo, row_pointer, 1);
  }

  jpeg_finish_compress(&cinfo);
  jpeg_destroy_compress(&cinfo);

  *out_buffer = out_buffer_ret;
  *out_size = (unsigned int)out_size_ret;

  return 0;
}

extern int encode_tga(unsigned char* rgb_buffer, unsigned int rgb_width, unsigned int rgb_height, unsigned int type, unsigned char **out_buffer, unsigned int *out_size, char **out_msg) 
{
  ImageData data = {
    rgb_width,
    rgb_height,
    rgb_width * rgb_height * 4,
    rgb_buffer,
  };
  ImageBoxData ret = process_image(data, type);
  *out_buffer = (unsigned char *)ret.data;
  *out_size = ret.len;
  return 0;
}