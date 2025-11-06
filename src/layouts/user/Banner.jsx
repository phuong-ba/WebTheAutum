import React from "react";
import { Carousel } from "antd";

const contentStyle = {
  margin: 0,
  minHeight: "720px",
  color: "#fff",
  lineHeight: "160px",
  textAlign: "center",
  background: "#364d79",
};

export default function Banner() {
  return (
    <div className="border-t border-r border-b rounded-b-[120px]  border-gray-300 rounded-tl-[120px] relative">
      <div className="-mt-[10px] border-gray-300">
        <div
          className="overflow-hidden rounded-tl-[120px] rounded-br-[120px]"
          style={{
            marginRight: "10px",
          }}
        >
          <Carousel arrows draggable autoplay infinite>
            <div>
              <div style={contentStyle}>1</div>
            </div>
            <div>
              <div style={contentStyle}>2</div>
            </div>
            <div>
              <div style={contentStyle}>3</div>
            </div>
            <div>
              <div style={contentStyle}>4</div>
            </div>
          </Carousel>
        </div>
      </div>
    </div>
  );
}
