import CustomButton from "@/components/atom/CustomButton/CustomButton";

export default function CustomDialogBox({
  showDialog,
  dialogRef,
  onClickNo,
  onClickYes,
  title,
  description,
  disableYesButton = false,
}) {
  return (
    showDialog && (
      <div className="border-light flex fixed top-0 left-0 h-full w-full bg-bg-forum bg-opacity-5 justify-center items-center z-10">
        <div
          ref={dialogRef}
          className="flex flex-col bg-bg-forum p-4 rounded-xl text-forum-heading"
        >
          <h3 className="font-semibold mb-2">{title}</h3>
          <p className="mb-4">{description}</p>
          <div className="flex mt-2 justify-end gap-2">
            <CustomButton onClick={onClickNo} disabled={disableYesButton}>
              No
            </CustomButton>
            <CustomButton
              theme="red"
              onClick={onClickYes}
              disabled={disableYesButton}
            >
              Yes
            </CustomButton>
          </div>
        </div>
      </div>
    )
  );
}
