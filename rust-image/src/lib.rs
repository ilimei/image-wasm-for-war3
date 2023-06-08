use std::io::Cursor;
use std::os::raw::c_void;
use std::os::raw::c_int;
use std::slice;
use image::ImageOutputFormat;
use image::RgbaImage;

#[repr(C)]
pub struct ImageData {
    width: c_int,
    height: c_int,
    len: c_int,
    data: *const c_void
}

#[repr(C)]
pub struct ImageBoxData {
    width: c_int,
    height: c_int,
    len: c_int,
    data: *const c_void
}

#[repr(C)]
#[derive(Copy, Clone)]
pub enum ImageFormat {
    TGA,
    PNG,
}

impl From<ImageFormat> for ImageOutputFormat {
    fn from(format: ImageFormat) -> Self {
        match format {
            ImageFormat::TGA => ImageOutputFormat::Tga,
            ImageFormat::PNG => ImageOutputFormat::Png,
        }
    }
}


#[no_mangle]
pub extern "C" fn process_image(image_data: ImageData, format: ImageFormat) -> ImageBoxData {
    // 将指针转换为 *const u8
    let data_ptr_u8: *const u8 = image_data.data as *const u8;
    // 使用 from_raw_parts 函数将 *const u8 转换为 &[u8]
    let data_slice: &[u8] = unsafe {
        slice::from_raw_parts(data_ptr_u8, image_data.len as usize)
    };
    // 将 &[u8] 转换为 Vec<u8>
    let data_vec: Vec<u8> = data_slice.to_vec();
    let img = RgbaImage::from_vec(image_data.width as u32, image_data.height as u32, data_vec).unwrap();
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
