use image::imageops;
use image::ImageFormat;
use image::ImageOutputFormat;
use image::RgbaImage;
use std::io::Cursor;
use std::os::raw::c_int;
use std::os::raw::c_void;
use std::slice;

#[repr(C)]
pub struct ImageData {
    width: c_int,
    height: c_int,
    len: c_int,
    data: *const c_void,
}

#[repr(C)]
pub struct ImageBoxData {
    width: c_int,
    height: c_int,
    len: c_int,
    data: *const c_void,
}

#[repr(C)]
#[derive(Copy, Clone)]
pub enum LibImageFormat {
    TGA,
    PNG,
}

impl From<LibImageFormat> for ImageOutputFormat {
    fn from(format: LibImageFormat) -> Self {
        match format {
            LibImageFormat::TGA => ImageOutputFormat::Tga,
            LibImageFormat::PNG => ImageOutputFormat::Png,
        }
    }
}

impl From<LibImageFormat> for ImageFormat {
    fn from(format: LibImageFormat) -> Self {
        match format {
            LibImageFormat::TGA => ImageFormat::Tga,
            LibImageFormat::PNG => ImageFormat::Png,
        }
    }
}

fn convert_void_ptr_to_u8_vector(ptr: *const c_void, len: usize) -> Vec<u8> {
    let slice = unsafe { slice::from_raw_parts(ptr as *const u8, len) };
    slice.to_vec()
}

#[no_mangle]
pub extern "C" fn rust_encode_image(image_data: ImageData, format: LibImageFormat) -> ImageBoxData {
    // 将 *const c_void 转换为 Vec<u8>
    let data_vec: Vec<u8> = convert_void_ptr_to_u8_vector(image_data.data, image_data.len as usize);
    let img =
        RgbaImage::from_vec(image_data.width as u32, image_data.height as u32, data_vec).unwrap();
    // 创建一个 Cursor 对象
    let mut cursor = Cursor::new(Vec::new());
    let img_fmt: ImageOutputFormat = format.into();
    img.write_to(&mut cursor, img_fmt).unwrap();
    // 获取编码后的 TGA 文件数据
    let tga_data = cursor.into_inner();
    // 将 Vec<u8> 转换为 Box<[u8]>
    let boxed_data = tga_data.into_boxed_slice();
    let len = boxed_data.len();
    // 将 Box<[u8]> 转换为 *mut c_void
    let data_ptr: *mut c_void = Box::into_raw(boxed_data) as *mut c_void;
    // 创建 ImageBoxData 对象并返回它
    ImageBoxData {
        width: image_data.width,
        height: image_data.height,
        len: len as c_int,
        data: data_ptr,
    }
}

#[no_mangle]
pub extern "C" fn rust_decode_image(image_data: ImageData, format: LibImageFormat) -> ImageBoxData {
    // 将 *const c_void 转换为 Vec<u8>
    let data_vec: Vec<u8> = convert_void_ptr_to_u8_vector(image_data.data, image_data.len as usize);
    let img_fmt: ImageFormat = format.into();
    let img = image::load_from_memory_with_format(&data_vec, img_fmt).unwrap();
    let img_width = img.width();
    let img_height = img.height();
    let img = img.to_rgba8();
    // 将 Vec<u8> 转换为 Box<[u8]>
    let boxed_data = img.into_raw().into_boxed_slice();
    let len = boxed_data.len();
    // 将 Box<[u8]> 转换为 *mut c_void
    let data_ptr: *mut c_void = Box::into_raw(boxed_data) as *mut c_void;
    // 创建 ImageBoxData 对象并返回它
    ImageBoxData {
        width: img_width as c_int,
        height: img_height as c_int,
        len: len as c_int,
        data: data_ptr,
    }
}

#[no_mangle]
pub extern "C" fn rust_resize_image(
    image_data: ImageData,
    width: c_int,
    height: c_int,
) -> ImageBoxData {
    // 将 *const c_void 转换为 Vec<u8>
    let data_vec: Vec<u8> = convert_void_ptr_to_u8_vector(image_data.data, image_data.len as usize);
    let img =
        RgbaImage::from_vec(image_data.width as u32, image_data.height as u32, data_vec).unwrap();
    let resized_img = imageops::resize(
        &img,
        width as u32,
        height as u32,
        imageops::FilterType::CatmullRom,
    );
    // 将 Vec<u8> 转换为 Box<[u8]>
    let boxed_data = resized_img.into_raw().into_boxed_slice();
    let len = boxed_data.len();
    // 将 Box<[u8]> 转换为 *mut c_void
    let data_ptr: *mut c_void = Box::into_raw(boxed_data) as *mut c_void;
    // 创建 ImageBoxData 对象并返回它
    ImageBoxData {
        width,
        height,
        len: len as c_int,
        data: data_ptr,
    }
}
