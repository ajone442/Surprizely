import { giftCategories } from "@shared/schema";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search } from "lucide-react";

interface GiftFiltersProps {
  selectedCategory: string | null;
  onCategoryChange: (category: string | null) => void;
  searchTerm: string;
  onSearchChange: (term: string) => void;
}

export default function GiftFilters({
  selectedCategory,
  onCategoryChange,
  searchTerm,
  onSearchChange,
}: GiftFiltersProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label>Search Gifts</Label>
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Categories</Label>
        <ScrollArea className="h-[300px] pr-4">
          <RadioGroup
            value={selectedCategory || ""}
            onValueChange={(value) => onCategoryChange(value || null)}
          >
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="" id="all" />
                <Label htmlFor="all">All Categories</Label>
              </div>
              {giftCategories.map((category) => (
                <div key={category} className="flex items-center space-x-2">
                  <RadioGroupItem value={category} id={category} />
                  <Label htmlFor={category}>{category}</Label>
                </div>
              ))}
            </div>
          </RadioGroup>
        </ScrollArea>
      </div>
    </div>
  );
}
