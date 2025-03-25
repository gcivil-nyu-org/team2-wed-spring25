import Icon from "@/components/atom/Icon/Icon";

export default function LikedIconList() {
  return (
    <div className="flex">
      <div>
        <Icon
          src="/icons/likeli.svg"
          width={16}
          height={16}
          alt="like"
          size="sm"
        />
      </div>

      <div className="-ml-2 z-1">
        <Icon
          src="/icons/heart.svg"
          width={16}
          height={16}
          alt="heart"
          size="sm"
        />
      </div>

      <div className="-ml-2 z-2">
        <Icon
          src="/icons/laugh.svg"
          width={16}
          height={16}
          alt="laugh"
          size="sm"
        />
      </div>
    </div>
  );
}
