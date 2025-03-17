import Icon from "@/components/atom/Icon/Icon";

export default function Loader({ size = "w-4 h-4", color = "text-gray-500" }) {
  return (
    <div className="flex flex-col justify-center items-center py-10">
      <Icon src={"/owl-logo.svg"} width={40} height={40} alt={"Loading..."} />
      <Icon
        src={"/icons/fade-stagger-circles.svg"}
        width={40}
        height={40}
        alt={"Loading..."}
      />
    </div>
  );
}
