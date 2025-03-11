import Image from "next/image";

export default function Icon({ onClick, src, width, height, alt, size }) {

    let data = "flex justify-center items-center rounded-full  hover:bg-gray-200";
    if (size === "md") {
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
                    className="object-cover hover:cursor-pointer"
                />
        </div>
    );
}