{/* Admin Navigation Links */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              <AdminCard 
                title="Manage Products" 
                description="Add, edit, or remove products from your catalog"
                icon={<Package2 className="h-6 w-6" />}
                href="/admin/products"
              />

              <AdminCard 
                title="Giveaway Entries" 
                description="View and export all customer giveaway submissions"
                icon={<Gift className="h-6 w-6" />}
                href="/admin/giveaway-entries"
              />

              {/* Add more admin functions as needed */}
            </div>