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

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Card className="hover:bg-accent cursor-pointer" onClick={() => navigate("/admin/giveaway-entries")}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Giveaway Entries
                  </CardTitle>
                  <Gift className="h-5 w-5 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">
                    View and manage giveaway entries
                  </p>
                </CardContent>
              </Card>
            </div>