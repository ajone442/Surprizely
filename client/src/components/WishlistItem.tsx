<Button
    variant="outline"
    size="sm"
    onClick={() => {
      if (product.affiliateLink) {
        const bonusUrl = `/bonus?link=${encodeURIComponent(product.affiliateLink)}&name=${encodeURIComponent(product.name)}`;
        window.location.href = bonusUrl;
      }
    }}
  >
    <ExternalLink className="h-4 w-4 mr-2" />
    View Product
  </Button>