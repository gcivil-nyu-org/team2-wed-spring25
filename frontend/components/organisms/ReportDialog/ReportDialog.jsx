import Icon from "@/components/atom/Icon/Icon";

export default function ReportDialog({
  reportCategories,
  reportCategorySelectedIndex,
  setReportCategorySelectedIndex,
  setShowReportCategoryDialog,
  handleReportComment,
  isReportedCommentLoading,
  reportCategoryDialogRef,
  reportedCategorySelected,
  reportedCategoryNotSelected,
}) {
  return (
    <div className="fixed top-0 left-0 bg-black h-full w-full flex justify-center items-center z-30 bg-opacity-50">
      <div
        ref={reportCategoryDialogRef}
        className="absolute w-full md:w-4/5 max-w-[744px] lg:w-2/5 xl:top-6 bg-white rounded-lg pl-6 pr-3 py-3 flex flex-col"
      >
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-medium">Report this comment</h2>
          <div className="hover:bg-gray-200 p-2 rounded-full">
            <Icon
              src={"/icons/close.svg"}
              size={"sm"}
              width={35}
              height={35}
              alt={"Close"}
              onClick={() => {
                setShowReportCategoryDialog(false);
                setReportCategorySelectedIndex(null);
              }}
            />
          </div>
        </div>
        <hr className="border-t-[1px] my-3"></hr>
        <div className="flex-1">
          <h4>Select a reason: </h4>
          <div className="flex flex-wrap mt-2 box-border">
            {reportCategories.map((category, index) => {
              return (
                <div
                  key={index}
                  className="flex items-center mr-4 mb-3"
                  onClick={() => {
                    setReportCategorySelectedIndex(index);
                  }}
                >
                  <label
                    htmlFor={index}
                    className={`px-3 py-1 rounded-full border-[1px] ${
                      reportCategorySelectedIndex == index
                        ? reportedCategorySelected
                        : reportedCategoryNotSelected
                    }  font-medium  hover:cursor-pointer`}
                  >
                    {category}
                  </label>
                </div>
              );
            })}
          </div>
        </div>
        <hr className="border-t-[1px] my-3"></hr>
        <div className="w-full flex justify-end">
          <button
            className={`px-4 py-2 ${
              reportCategorySelectedIndex != null
                ? "bg-blue-600"
                : "bg-gray-200"
            } ${
              reportCategorySelectedIndex != null
                ? "text-white"
                : "text-gray-500"
            } ${
              reportCategorySelectedIndex != null ? "hover:bg-blue-900" : ""
            } ${
              reportCategorySelectedIndex != null
                ? "cursor-pointer"
                : "cursor-not-allowed"
            } font-medium rounded-full `}
            onClick={handleReportComment}
            disabled={
              reportCategorySelectedIndex == null || isReportedCommentLoading
            }
          >
            {isReportedCommentLoading ? "Reporting..." : "Report"}
          </button>
        </div>
      </div>
    </div>
  );
}
