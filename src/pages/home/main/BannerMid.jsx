import { Carousel } from "antd";
import img1 from "/src/assets/img/74c344f93b409ea2fa0189faf9dfe2e1.webp";

export default function BannerMid() {
  const images = [img1];

  return (
    <>
      <div>
        {images.map((image, index) => (
          <div key={index}>
            <div>
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
      </div>
    </>
  );
}
