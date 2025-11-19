import React from "react";
import { Carousel } from "antd";
import img1 from "../../assets/img/74c344f93b409ea2fa0189faf9dfe2e1.webp";
import img2 from "../../assets/img/678bf312081fa01bb8d10c0e8c6b73e2.webp";
import img3 from "../../assets/img/a74138038a7c1cb247d160891f352e69.webp";
import img4 from "../../assets/img/banner-ao-thun-nam-dep-2025.webp";
const contentStyle = {
  margin: 0,
  minHeight: "720px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

export default function Banner() {
  const images = [img1, img2, img3, img4];

  return (
    <>
      <div className="border-t border-gray-300">
        <div className="border-r border-b rounded-b-[110px] border-gray-300">
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
            {images.map((image, index) => (
              <div key={index}>
                <div style={contentStyle}>
                  <img
                    src={image}
                    alt={`Banner ${index + 1}`}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                </div>
              </div>
            ))}
          </Carousel>
        </div>
      </div>
    </>
  );
}
