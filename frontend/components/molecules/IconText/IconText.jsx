import Image from "next/image";

export default function IconText({ src, width, height, alt, text }) {
    const data = `w-15 h-15`;
    return (
        <div className="flex flex-1 p-2 my-3 mx-1 space-x-1 justify-center items-center rounded-md hover:bg-slate-100 hover:cursor-pointer">
            <div className={data}>
                <Image
                    src={src}
                    width={width}
                    height={height}
                    alt={alt}
                    className="object-fill "
                />
            </div>
            <p className="text-slate-600 text-sm font-bold group-hover:text-slate-900">
                {text}
            </p>
        </div>
    );
}