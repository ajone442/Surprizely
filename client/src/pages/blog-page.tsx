
import React from "react";
import { Helmet } from "react-helmet";
import { Container } from "@/components/ui/container";

const BlogPage = () => {
  // Sample blog posts data
  const blogPosts = [
    {
      id: 1,
      title: "10 Thoughtful Gift Ideas for Any Occasion",
      excerpt: "Finding the perfect gift can be challenging. Here are our top picks that work for birthdays, anniversaries, and more.",
      date: "May 15, 2023",
      imageUrl: "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1024&q=80",
    },
    {
      id: 2,
      title: "The Art of Personalized Gifting",
      excerpt: "Learn how to make any gift more special by adding a personalized touch that shows you really care.",
      date: "June 2, 2023",
      imageUrl: "https://images.unsplash.com/photo-1513885535751-8b9238bd345a?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1024&q=80",
    },
    {
      id: 3,
      title: "Gift-Giving Traditions Around the World",
      excerpt: "Explore fascinating gift-giving customs and traditions from different cultures around the globe.",
      date: "July 10, 2023",
      imageUrl: "https://images.unsplash.com/photo-1512909006721-3d6018887383?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1024&q=80",
    },
  ];

  return (
    <>
      <Helmet>
        <title>Blog | Suprizely</title>
      </Helmet>
      <Container className="py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Gift Ideas & Inspiration</h1>
          
          <div className="grid gap-10">
            {blogPosts.map((post) => (
              <div key={post.id} className="border border-border rounded-lg overflow-hidden shadow-sm">
                <div className="aspect-video w-full overflow-hidden">
                  <img 
                    src={post.imageUrl} 
                    alt={post.title} 
                    className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                  />
                </div>
                <div className="p-6">
                  <p className="text-sm text-muted-foreground mb-2">{post.date}</p>
                  <h2 className="text-xl font-semibold mb-3">{post.title}</h2>
                  <p className="text-muted-foreground mb-4">{post.excerpt}</p>
                  <button className="text-primary font-medium hover:underline">
                    Read more
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Container>
    </>
  );
};

export default BlogPage;
