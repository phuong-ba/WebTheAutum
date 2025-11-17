import React from "react";

export default function ProductCollection() {
  return (
    <>
      <div  className="flex flex-col gap-10">
        <div className="flex flex-col  gap-4 items-center">
          <div className="flex flex-col items-center ">
            <div className="font-bold text-2xl">NEW COLLECTION 2025</div>
          </div>
          <div className="grid grid-cols-4 gap-7">
            <div className="min-w-[410px] bg-amber-200 max-h-[400px] min-h-[400px] rounded-br-4xl rounded-tl-4xl"></div>
            <div className="min-w-[410px] bg-amber-200 max-h-[400px] min-h-[400px] rounded-br-4xl rounded-tl-4xl"></div>
            <div className="min-w-[410px] bg-amber-200 max-h-[400px] min-h-[400px] rounded-br-4xl rounded-tl-4xl"></div>
            <div className="min-w-[410px] bg-amber-200 max-h-[400px] min-h-[400px] rounded-br-4xl rounded-tl-4xl"></div>
          </div>
        </div>
        <div className="  border-gray-300">
          <div className="border-r border-b border-t  rounded-l-[120px] rounded-b-[120px] border-gray-300">
            <div
              style={{
                overflow: "hidden",
                borderTopLeftRadius: "120px",
                borderBottomRightRadius: "120px",
                marginRight: "10px",
              }}
              arrows
              draggable
              autoplay={true}
              infinite={true}
            >
              <div className="min-h-[720px] bg-amber-700">1</div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
