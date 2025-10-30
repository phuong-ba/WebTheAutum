import React from "react";
import { Link } from "react-router";

export default function ProductNew() {
  return (
    <>
      <div className="flex flex-col items-center gap-8">
        <div className="font-bold text-2xl">NEW ARRIVAL</div>
        <div className="flex gap-10">
          <Link>Danh Mục 1</Link>
          <Link>Danh Mục 1</Link>
        </div>
      </div>
    </>
  );
}
