import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { getStudentByEmail } from "@/lib/db";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async signIn({ user }) {
      // Izinkan login Google siswa
      return true;
    },
    async jwt({ token, user }) {
      // Ambil data siswa dari database Neon saat token dibuat atau diperbarui
      if (token.email) {
        try {
          const student = await getStudentByEmail(token.email);
          if (student) {
            token.studentId = student.id;
            token.studentName = student.name;
            token.parentEmail = student.parentEmail;
            token.isEnrolled = true;
          } else {
            token.isEnrolled = false;
          }
        } catch (err) {
          console.error("Auth JWT: Gagal mencocokkan data siswa di database:", err);
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.sub;
        (session.user as any).studentId = token.studentId || null;
        (session.user as any).studentName = token.studentName || null;
        (session.user as any).parentEmail = token.parentEmail || null;
        (session.user as any).isEnrolled = Boolean(token.isEnrolled);
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET || "ggstudy_default_secret_key_change_in_production",
  pages: {
    signIn: "/", // Redirect ke beranda jika butuh sign in
  },
};

