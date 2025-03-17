import Icon from "@/components/atom/Icon/Icon";

export default function LikedIconList() {
  return (
    <div className="flex">
      <div>
        <Icon
          src="/icons/likeli.svg"
          width={18}
          height={18}
          alt="like"
          size="sm"
        />
      </div>

      <div className="-ml-2 z-1">
        <Icon
          src="/icons/heart.svg"
          width={18}
          height={18}
          alt="heart"
          size="sm"
        />
      </div>

      <div className="-ml-2 z-2">
        <Icon
          src="/icons/laugh.svg"
          width={18}
          height={18}
          alt="laugh"
          size="sm"
        />
      </div>
    </div>
  );
}
