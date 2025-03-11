import Image from "next/image";

export default function Icon({ onClick, src, width, height, alt, size }) {

    let data = "flex justify-center items-center rounded-full  hover:bg-gray-200 hover:cursor-pointer";
    if (size === "sm") {
        data = "w-5 h-5 " + data;
    }else if (size === "md") {
        data = "w-7 h-7 " + data;
    }else if (size === "lg") {
        data = "w-10 h-10 " + data;
    }
    return (
        <div 
            onClick={onClick} 
            className={data}>
                <Image
                    src={src}
                    width={width}
                    height={height}
                    alt={alt}
                />
        </div>
    );
}