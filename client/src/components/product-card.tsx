// Assuming this is within a React component rendering product cards
const ProductCard = ({ product }) => {

  const handleClick = () => {
    const bonusUrl = `/bonus?link=${encodeURIComponent(product.affiliateLink)}&name=${encodeURIComponent(product.name)}`;
    window.location.href = bonusUrl;
  };

  return (
    <div>
      <h3>{product.name}</h3>
      <button onClick={handleClick}>Product</button>
    </div>
  );
};

export default ProductCard;

// ...rest of the application code (bonus.html, backend handling, database interaction, email sending) would go here.  This is not provided in the original or changes.