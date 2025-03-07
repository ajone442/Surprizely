export function useProducts(options?: { category?: string }) {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['products', options?.category],
    queryFn: () => fetchProducts(options?.category),
  });

  return {
    products: Array.isArray(data) ? data : [],
    isLoading,
    refetchProducts: refetch,
  };
}