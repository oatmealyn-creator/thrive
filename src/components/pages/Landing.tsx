import { motion } from "motion/react";
import { Sprout, Camera, MessageCircle, Share2, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const HERO_IMG = "https://images.pexels.com/photos/5230900/pexels-photo-5230900.jpeg";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="px-6 sm:px-10 lg:px-16 py-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sprout className="w-7 h-7 text-primary" strokeWidth={1.5} />
          <span className="font-display text-2xl tracking-tight">Plotly</span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/login"
            className="hidden sm:inline-flex items-center gap-2 border border-foreground text-foreground px-5 py-2.5 rounded-full text-sm font-medium hover:bg-secondary transition-colors"
          >
            Sign in
          </Link>
          <Link
            to="/register"
            className="hidden sm:inline-flex items-center gap-2 bg-foreground text-background px-5 py-2.5 rounded-full text-sm font-medium hover:bg-primary transition-colors"
          >
            Get started
          </Link>
        </div>
      </header>

      <section className="px-6 sm:px-10 lg:px-16 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center pt-6 pb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-bold mb-6">
            For independent gardeners
          </div>
          <h1 className="font-display font-light text-5xl sm:text-6xl lg:text-7xl leading-[1.1] tracking-tight">
            Grow what you love.
            <br />
            <span className="text-primary italic font-normal">Sell it from your phone.</span>
          </h1>
          <p className="mt-8 text-lg text-muted-foreground max-w-[28rem] leading-relaxed">
            Snap a photo, set a price, share your link. Customers order through WhatsApp — no
            apps, no fees, no friction.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4">
            <Link
              to="/register"
              className="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground px-7 py-4 rounded-full text-base font-medium hover:bg-[#3A5233] transition-colors shadow-sm"
            >
              Start your storefront <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="#how"
              className="inline-flex items-center justify-center gap-2 border border-foreground text-foreground px-7 py-4 rounded-full text-base font-medium hover:bg-secondary transition-colors"
            >
              See how it works
            </a>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="relative"
        >
          <div className="relative rounded-[2rem] overflow-hidden border border-border shadow-xl">
            <img
              src={HERO_IMG}
              alt="Gardener with potted plant"
              className="w-full h-[420px] sm:h-[520px] object-cover"
            />
            <div className="absolute inset-x-6 bottom-6 bg-white/90 backdrop-blur-xl rounded-2xl p-5 border border-white/40 shadow-lg">
              <div className="flex items-center justify-between">
                <div className="min-w-0">
                  <div className="font-display text-lg text-foreground truncate">Mango Sapling</div>
                  <div className="text-xs uppercase tracking-widest text-muted-foreground mt-1">Plants</div>
                </div>
                <div className="text-2xl font-display text-primary">$24</div>
              </div>
            </div>
            <div className="absolute top-6 left-6 bg-accent text-white text-xs uppercase tracking-widest px-3 py-1.5 rounded-full font-bold">
              Live
            </div>
          </div>
        </motion.div>
      </section>

      <section id="how" className="px-6 sm:px-10 lg:px-16 py-20 border-t border-border">
        <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-bold mb-3">How it works</div>
        <h2 className="font-display text-4xl sm:text-5xl text-foreground max-w-[36rem] leading-tight mb-16">
          From your backyard to their doorstep in four steps.
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { icon: Camera, t: "Snap a photo", d: "Take a picture of any plant, pot or tool you have." },
            { icon: Sprout, t: "Set a price", d: "Add a name, price and category — done in seconds." },
            { icon: Share2, t: "Share your link", d: "Your storefront lives at plotly.app/g/your-name." },
            { icon: MessageCircle, t: "Get orders on WhatsApp", d: "Customers tap order — message lands in your chat." },
          ].map((s, i) => (
            <motion.div
              key={s.t}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="bg-card border border-border rounded-3xl p-7 hover:shadow-md transition-shadow"
            >
              <s.icon className="w-7 h-7 text-primary" strokeWidth={1.5} />
              <div className="font-display text-xl mt-5 text-foreground">{s.t}</div>
              <div className="text-muted-foreground mt-2 text-sm leading-relaxed">{s.d}</div>
              <div className="text-xs text-muted-foreground uppercase tracking-widest mt-6">Step {String(i + 1).padStart(2, "0")}</div>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="px-6 sm:px-10 lg:px-16 pb-24">
        <div className="bg-foreground text-background rounded-[2.5rem] p-10 sm:p-16 relative overflow-hidden">
          <div className="relative z-10 max-w-[36rem]">
            <h3 className="font-display text-4xl sm:text-5xl leading-tight">
              Your garden, your store, your rules.
            </h3>
            <p className="mt-5 text-[#C4CFB9] text-lg">
              No setup fee. No commission. Just plant, post, and grow.
            </p>
            <Link
              to="/register"
              className="inline-block mt-8 bg-accent text-white px-7 py-4 rounded-full font-medium hover:bg-[#b86a4d] transition-colors"
            >
              Start your storefront — it's free
            </Link>
          </div>
          <Sprout className="absolute right-8 bottom-8 w-48 h-48 text-primary/30" strokeWidth={0.6} />
        </div>
      </section>

      <footer className="px-6 sm:px-10 lg:px-16 py-8 border-t border-border text-sm text-muted-foreground">
        © {new Date().getFullYear()} Plotly · Made with soil and sunlight.
      </footer>
    </div>
  );
}
