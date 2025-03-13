import Icon from "@/components/atom/Icon/Icon";

export default function LikeOptionList() {
    return (
        <div className="flex">
            <div>
                <Icon
                    src="/icons/likeli.svg"
                    width={25}
                    height={25}
                    alt="like"
                    size="sm"
                />
            </div>
            <div >
                <Icon 
                    src="/icons/clap.svg"
                    width={25}
                    height={25}
                    alt="heart"
                    size="sm"
                    
                />
            </div>
            <div >
                <Icon
                    src="/icons/support.svg"
                    width={25}
                    height={25}
                    alt="laugh"
                    size="sm"
                />
            </div>
            <div >
                <Icon 
                    src="/icons/heart.svg"
                    width={25}
                    height={25}
                    alt="laugh"
                    size="sm"
                />
            </div>
            <div>
                <Icon 
                    src="/icons/bulb.svg"
                    width={25}
                    height={25}
                    alt="laugh"
                    size="sm"
                />
            </div>
            <div>
                <Icon 
                    src="/icons/laugh.svg"
                    width={25}
                    height={25}
                    alt="laugh"
                    size="sm"
                />
            </div>
        </div>
    );
}