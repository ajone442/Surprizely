<DropdownMenuContent align="end" className="w-56">
    <DropdownMenuLabel>My Account</DropdownMenuLabel>
    <DropdownMenuSeparator />
    <DropdownMenuItem onClick={() => setLocation("/account")}>
      <User className="mr-2 h-4 w-4" />
      <span>Account Settings</span>
    </DropdownMenuItem>
    <DropdownMenuItem onClick={() => setLocation("/wishlist")}>
      <Heart className="mr-2 h-4 w-4" />
      <span>Wishlist</span>
    </DropdownMenuItem>
</DropdownMenuContent>