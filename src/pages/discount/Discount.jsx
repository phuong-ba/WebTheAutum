import { useState } from "react";
import DiscountList from "./DiscountList";
import DiscountForm from "./DiscountForm";

export default function Discount() {
  const [isCreating, setIsCreating] = useState(false);
  const [selectedDiscountId, setSelectedDiscountId] = useState(null);

  const handleView = (id) => {
    setSelectedDiscountId(id);
    setIsCreating(true);
  };

  const handleCreateNew = () => {
    setSelectedDiscountId(null);
    setIsCreating(true);
  };

  const handleCancel = () => {
    setIsCreating(false);
    setSelectedDiscountId(null);
  };

  const handleSave = () => {
    setIsCreating(false);
    setSelectedDiscountId(null);
  };

  return (
    <div className="bg-white min-h-screen p-5">
      {!isCreating ? (
        <DiscountList onView={handleView} onCreateNew={handleCreateNew} />
      ) : (
        <DiscountForm
          discountId={selectedDiscountId}
          onCancel={handleCancel}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
