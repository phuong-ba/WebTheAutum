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
    <>
      <div className="border-t border-gray-300">
        <div className="border-r border-b  rounded-b-[110px] border-gray-300">
          <Carousel
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
    </>
  );
}
