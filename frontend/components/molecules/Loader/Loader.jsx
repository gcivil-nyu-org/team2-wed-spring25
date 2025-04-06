import Image from "next/image";

export default function Loader({ size = "w-4 h-4", color = "text-gray-500" }) {
  return (
    <div className="flex flex-col justify-center items-center py-10">
      <Image src={"/owl-logo.svg"} width={40} height={40} alt={"Loading..."} />
      <Image
        src={"/icons/loader-ellipsis.gif"}
        width={80}
        height={80}
        alt={"Loading..."}
      />
    </div>
  );
}
