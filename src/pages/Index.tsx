
import Hero from "@/components/Hero";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PurposeInput from "@/components/PurposeInput";

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <Hero />
        <PurposeInput />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
