import React, { useState, useEffect, useRef } from 'react';
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, collection, addDoc, query, where, onSnapshot } from 'firebase/firestore';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  onAuthStateChanged, 
  signOut,
  updateProfile,
  setPersistence,
  browserLocalPersistence,
  sendPasswordResetEmail
} from "firebase/auth";
import { 
  ShoppingBag, Plus, Minus, X, MapPin, Phone, User, CheckCircle, 
  Search, MessageCircle, AlertCircle, Clock, History, LogOut, 
  ChefHat, Bike, BellRing, RefreshCw, Menu as MenuIcon,
  Mail, Lock
} from 'lucide-react';

// --- TIPAGENS ---
interface AddOn { id: string; name: string; price: number; qty?: number; }
interface Product { id: number; name: string; price: number; category: string; desc: string; image: string; }
interface CartItem extends Product { qty: number; cartItemId: string; removedIngredients: string[]; addOns: AddOn[]; finalPrice: number; note?: string; }
interface OrderData { id?: string; orderNumber: number; customerId: string; customerName: string; phone: string; address: string; deliveryFee: number; items: CartItem[]; total: number; paymentMethod: string; notes: string; status: string; createdAt: string; }

// --- CONFIGURAÇÃO FIREBASE ---
const firebaseConfig = {
  apiKey: "AIzaSyCVSiu02BNaxV-9NQAAK0Gs89M6bVAgGOE",
  authDomain: "jottafood-e0583.firebaseapp.com",
  projectId: "jottafood-e0583",
  storageBucket: "jottafood-e0583.firebasestorage.app",
  messagingSenderId: "92191488084",
  appId: "1:92191488084:web:63a46f264966dfa56cd5c1"
};

// --- UID DO ADMIN FIXADO ---
const RESTAURANT_OWNER_ID = "Pyso1iXyD7QklT6ZjECv4jxxxRE3"; 
const WHATSAPP_NUMBER = "5562991812291"; // Número do Papitos

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);
const auth = getAuth(app);

// --- DADOS DO CARDÁPIO E RECEITAS ---
const RECIPES: Record<number, Record<string, number>> = {
  1: { pao: 1, carne: 2, bacon: 1, salsicha: 1, ovo: 1, presunto: 1, queijo: 1, milho: 1, batata: 1, alface: 1, tomate: 1 }, 
  2: { pao: 1, carne: 1, bacon: 1, salsicha: 1, ovo: 1, presunto: 1, queijo: 1, milho: 1, batata: 1, alface: 1, tomate: 1 }, 
  3: { pao: 1, carne: 1, bacon: 1, ovo: 1, presunto: 1, queijo: 1, milho: 1, batata: 1, alface: 1, tomate: 1 }, 
  4: { pao: 1, carne: 1, bacon: 1, presunto: 1, queijo: 1, milho: 1, batata: 1, alface: 1, tomate: 1 }, 
  5: { pao: 1, carne: 1, ovo: 1, presunto: 1, queijo: 1, milho: 1, batata: 1, alface: 1, tomate: 1 }, 
  6: { pao: 1, carne: 1, presunto: 1, queijo: 1, milho: 1, batata: 1, alface: 1, tomate: 1 }, 
  7: { pao: 1, frango: 1, carne: 1, bacon: 1, salsicha: 1, ovo: 1, presunto: 1, queijo: 1, milho: 1, batata: 1, alface: 1, tomate: 1 }, 
  8: { pao: 1, frango: 1, bacon: 1, salsicha: 1, ovo: 1, presunto: 1, queijo: 1, milho: 1, batata: 1, alface: 1, tomate: 1 }, 
  9: { pao: 1, frango: 1, bacon: 1, ovo: 1, presunto: 1, queijo: 1, milho: 1, batata: 1, alface: 1, tomate: 1 }, 
  10: { pao: 1, frango: 1, bacon: 1, presunto: 1, queijo: 1, milho: 1, batata: 1, alface: 1, tomate: 1 }, 
  11: { pao: 1, frango: 1, ovo: 1, presunto: 1, queijo: 1, milho: 1, batata: 1, alface: 1, tomate: 1 }, 
  12: { pao: 1, frango: 1, queijo: 1, milho: 1, batata: 1, alface: 1, tomate: 1 }, 
  13: { pao: 1, lombo: 1, carne: 1, bacon: 1, salsicha: 1, ovo: 1, presunto: 1, queijo: 1, milho: 1, batata: 1, alface: 1, tomate: 1 }, 
  14: { pao: 1, lombo: 1, bacon: 1, salsicha: 1, ovo: 1, presunto: 1, queijo: 1, milho: 1, batata: 1, alface: 1, tomate: 1 }, 
  15: { pao: 1, lombo: 1, bacon: 1, ovo: 1, presunto: 1, queijo: 1, milho: 1, batata: 1, alface: 1, tomate: 1 }, 
  16: { pao: 1, lombo: 1, bacon: 1, presunto: 1, queijo: 1, milho: 1, batata: 1, alface: 1, tomate: 1 }, 
  17: { pao: 1, lombo: 1, ovo: 1, presunto: 1, queijo: 1, milho: 1, batata: 1, alface: 1, tomate: 1 }, 
  18: { pao: 1, lombo: 1, queijo: 1, milho: 1, batata: 1, alface: 1, tomate: 1 }, 
  19: { pao: 1, mignon: 1, carne: 1, bacon: 1, salsicha: 1, ovo: 1, presunto: 1, queijo: 1, milho: 1, batata: 1, alface: 1, tomate: 1 }, 
  20: { pao: 1, mignon: 1, bacon: 1, salsicha: 1, ovo: 1, presunto: 1, queijo: 1, milho: 1, batata: 1, alface: 1, tomate: 1 }, 
  21: { pao: 1, mignon: 1, bacon: 1, ovo: 1, presunto: 1, queijo: 1, milho: 1, batata: 1, alface: 1, tomate: 1 }, 
  22: { pao: 1, mignon: 1, bacon: 1, presunto: 1, queijo: 1, milho: 1, batata: 1, alface: 1, tomate: 1 }, 
  23: { pao: 1, mignon: 1, ovo: 1, presunto: 1, queijo: 1, milho: 1, batata: 1, alface: 1, tomate: 1 }, 
  24: { pao: 1, mignon: 1, queijo: 1, milho: 1, batata: 1, alface: 1, tomate: 1 }, 
  25: { pao_sirio: 1, frango: 1, queijo: 1, milho: 1, alface: 1, tomate: 1 }, 
  26: { pao_sirio: 1, mignon: 1, queijo: 1, milho: 1, alface: 1, tomate: 1 }, 
  27: { pao: 1, presunto: 2, queijo: 2 }, 
  28: { pao: 1, salsicha: 2, ovo: 1, presunto: 1, queijo: 1, milho: 1, batata: 1, alface: 1, tomate: 1 }, 
  29: { pao: 1, salsicha: 1, ovo: 1, bacon: 1, presunto: 1, queijo: 1, milho: 1, batata: 1, alface: 1, tomate: 1 }, 
  33: { batata: 150 }, 34: { batata: 250 }, 35: { batata: 500 }, 
  36: { batata: 250, queijo: 2, cheddar: 50, bacon: 30 }, 
  37: { batata: 500, queijo: 4, cheddar: 100, bacon: 60 }, 
  38: { batata: 250, queijo: 2, catupiry: 50, mignon: 2 }, 
  39: { batata: 500, queijo: 4, catupiry: 100, mignon: 4 }, 
};

const STOCK_NAMES: Record<string, string> = {
  pao: 'Pão de Hambúrguer', pao_sirio: 'Pão Sírio', carne: 'Hambúrguer', frango: 'Frango', lombo: 'Lombo', mignon: 'Filé Mignon',
  salsicha: 'Salsicha', bacon: 'Bacon', ovo: 'Ovo', queijo: 'Mussarela', presunto: 'Presunto', cheddar: 'Cheddar', catupiry: 'Catupiry',
  alface: 'Alface', tomate: 'Tomate', milho: 'Milho', batata: 'Batata Palha/Frita'
};

const AVAILABLE_ADDONS: AddOn[] = [
  { id: '40', name: 'Adic. Hambúrguer', price: 5.00 }, { id: '41', name: 'Adic. Mussarela', price: 3.00 }, { id: '42', name: 'Adic. Presunto', price: 3.00 },
  { id: '43', name: 'Adic. Ovo', price: 3.00 }, { id: '44', name: 'Adic. Bacon', price: 3.00 }, { id: '45', name: 'Adic. Salsicha', price: 3.00 },
  { id: '46', name: 'Adic. Catupiry', price: 3.00 }, { id: '47', name: 'Adic. Cheddar', price: 3.00 }, { id: '48', name: 'Adic. Pão Sírio', price: 4.00 },
  { id: '49', name: 'Adic. Lombo', price: 7.00 }, { id: '50', name: 'Adic. Picanha', price: 13.00 }, { id: '51', name: 'Adic. Filé Mignon', price: 12.00 },
  { id: '52', name: 'Adic. Filé de Frango', price: 8.00 }, { id: '53', name: 'Adic. Molho de Ervas', price: 1.00 }, { id: '54', name: 'Adic. Molho de Alho', price: 1.00 },
  { id: '55', name: 'Adic. Molho Papitos', price: 1.00 }, { id: '90', name: 'Adic. Abacaxi', price: 0.00 }, { id: '91', name: 'Adic. Cebola', price: 0.00 },
];

const MENU_ITEMS: Product[] = [
  { id: 1, name: 'Papitos Duplo', price: 30.00, category: 'Hambúrguer', desc: 'Pão, 2x Hambúrguer, Bacon, Salsicha, Ovo, Presunto, Mussarela, Milho, Batata, Alface e Tomate.', image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=500&q=60' },
  { id: 2, name: 'X Tudo', price: 26.00, category: 'Hambúrguer', desc: 'Pão, Hambúrguer, Bacon, Salsicha, Ovo, Presunto, Mussarela, Milho, Batata, Alface e Tomate.', image: 'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?auto=format&fit=crop&w=500&q=60' },
  { id: 3, name: 'X Bacon Especial', price: 24.00, category: 'Hambúrguer', desc: 'Pão, Hambúrguer, Bacon, Ovo, Presunto, Mussarela, Milho, Batata, Alface e Tomate.', image: 'https://images.unsplash.com/photo-1607013251379-e6eecfffe234?auto=format&fit=crop&w=500&q=60' },
  { id: 4, name: 'X Bacon Simples', price: 22.00, category: 'Hambúrguer', desc: 'Pão, Hambúrguer, Bacon, Presunto, Mussarela, Milho, Batata, Alface e Tomate.', image: 'https://images.unsplash.com/photo-1553979459-d2229ba7433b?auto=format&fit=crop&w=500&q=60' },
  { id: 5, name: 'X Salada Especial', price: 20.00, category: 'Hambúrguer', desc: 'Pão, Hambúrguer, Ovo, Presunto, Mussarela, Milho, Batata, Alface e Tomate.', image: 'https://images.unsplash.com/photo-1572802419224-296b0aeee0d9?auto=format&fit=crop&w=500&q=60' },
  { id: 6, name: 'X Salada Simples', price: 18.00, category: 'Hambúrguer', desc: 'Pão, Hambúrguer, Presunto, Mussarela, Milho, Batata, Alface e Tomate.', image: 'https://images.unsplash.com/photo-1551782450-a2132b4ba21d?auto=format&fit=crop&w=500&q=60' },
  { id: 7, name: 'X Papitos Frango', price: 30.00, category: 'Frango', desc: 'Pão, Frango, Hambúrguer, Bacon, Salsicha, Ovo, Presunto, Mussarela, Milho, Batata, Alface e Tomate.', image: 'https://images.unsplash.com/photo-1619250907534-c0e5a62a9803?auto=format&fit=crop&w=500&q=60' },
  { id: 8, name: 'X Frango Tudo', price: 28.00, category: 'Frango', desc: 'Pão, Frango, Bacon, Salsicha, Ovo, Presunto, Mussarela, Milho, Batata, Alface e Tomate.', image: 'https://images.unsplash.com/photo-1619250907534-c0e5a62a9803?auto=format&fit=crop&w=500&q=60' },
  { id: 9, name: 'X Frango Bacon Especial', price: 26.00, category: 'Frango', desc: 'Pão, Frango, Bacon, Ovo, Presunto, Mussarela, Milho, Batata, Alface e Tomate.', image: 'https://images.unsplash.com/photo-1619250907534-c0e5a62a9803?auto=format&fit=crop&w=500&q=60' },
  { id: 10, name: 'X Frango Bacon Simples', price: 24.00, category: 'Frango', desc: 'Pão, Frango, Bacon, Presunto, Mussarela, Milho, Batata, Alface e Tomate.', image: 'https://images.unsplash.com/photo-1619250907534-c0e5a62a9803?auto=format&fit=crop&w=500&q=60' },
  { id: 11, name: 'X Frango Especial', price: 22.00, category: 'Frango', desc: 'Pão, Frango, Ovo, Presunto, Mussarela, Milho, Batata, Alface e Tomate.', image: 'https://images.unsplash.com/photo-1619250907534-c0e5a62a9803?auto=format&fit=crop&w=500&q=60' },
  { id: 12, name: 'X Frango Simples', price: 20.00, category: 'Frango', desc: 'Pão, Frango, Mussarela, Milho, Batata, Alface e Tomate.', image: 'https://images.unsplash.com/photo-1619250907534-c0e5a62a9803?auto=format&fit=crop&w=500&q=60' },
  { id: 13, name: 'Papitos Lombo', price: 31.00, category: 'Lombo', desc: 'Pão, Lombo, Hambúrguer, Bacon, Salsicha, Ovo, Presunto, Mussarela, Milho, Batata, Alface e Tomate.', image: 'https://images.unsplash.com/photo-1603064750555-408eab413e14?auto=format&fit=crop&w=500&q=60' },
  { id: 14, name: 'X Lombo Tudo', price: 28.00, category: 'Lombo', desc: 'Pão, Lombo, Bacon, Salsicha, Ovo, Presunto, Mussarela, Milho, Batata, Alface e Tomate.', image: 'https://images.unsplash.com/photo-1603064750555-408eab413e14?auto=format&fit=crop&w=500&q=60' },
  { id: 15, name: 'X Lombo Bacon Especial', price: 26.00, category: 'Lombo', desc: 'Pão, Lombo, Bacon, Ovo, Presunto, Mussarela, Milho, Batata, Alface e Tomate.', image: 'https://images.unsplash.com/photo-1603064750555-408eab413e14?auto=format&fit=crop&w=500&q=60' },
  { id: 16, name: 'X Lombo Bacon Simples', price: 24.00, category: 'Lombo', desc: 'Pão, Lombo, Bacon, Presunto, Mussarela, Milho, Batata, Alface e Tomate.', image: 'https://images.unsplash.com/photo-1603064750555-408eab413e14?auto=format&fit=crop&w=500&q=60' },
  { id: 17, name: 'X Lombo Especial', price: 22.00, category: 'Lombo', desc: 'Pão, Lombo, Ovo, Presunto, Mussarela, Milho, Batata, Alface e Tomate.', image: 'https://images.unsplash.com/photo-1603064750555-408eab413e14?auto=format&fit=crop&w=500&q=60' },
  { id: 18, name: 'X Lombo Simples', price: 20.00, category: 'Lombo', desc: 'Pão, Lombo, Mussarela, Milho, Batata, Alface e Tomate.', image: 'https://images.unsplash.com/photo-1603064750555-408eab413e14?auto=format&fit=crop&w=500&q=60' },
  { id: 19, name: 'X Papitos Mignon', price: 33.00, category: 'Filé Mignon', desc: 'Pão, Filé, Hambúrguer, Bacon, Salsicha, Ovo, Presunto, Mussarela, Milho, Batata, Alface e Tomate.', image: 'https://images.unsplash.com/photo-1603064750555-408eab413e14?auto=format&fit=crop&w=500&q=60' },
  { id: 20, name: 'X Mignon Tudo', price: 31.00, category: 'Filé Mignon', desc: 'Pão, Filé, Bacon, Salsicha, Ovo, Presunto, Mussarela, Milho, Batata, Alface e Tomate.', image: 'https://images.unsplash.com/photo-1603064750555-408eab413e14?auto=format&fit=crop&w=500&q=60' },
  { id: 21, name: 'X Mignon Bacon Especial', price: 28.00, category: 'Filé Mignon', desc: 'Pão, Filé, Bacon, Ovo, Presunto, Mussarela, Milho, Batata, Alface e Tomate.', image: 'https://images.unsplash.com/photo-1603064750555-408eab413e14?auto=format&fit=crop&w=500&q=60' },
  { id: 22, name: 'X Mignon Bacon Simples', price: 26.00, category: 'Filé Mignon', desc: 'Pão, Filé, Bacon, Presunto, Mussarela, Milho, Batata, Alface e Tomate.', image: 'https://images.unsplash.com/photo-1603064750555-408eab413e14?auto=format&fit=crop&w=500&q=60' },
  { id: 23, name: 'X Mignon Especial', price: 24.00, category: 'Filé Mignon', desc: 'Pão, Filé, Ovo, Presunto, Mussarela, Milho, Batata, Alface e Tomate.', image: 'https://images.unsplash.com/photo-1603064750555-408eab413e14?auto=format&fit=crop&w=500&q=60' },
  { id: 24, name: 'X Mignon Simples', price: 22.00, category: 'Filé Mignon', desc: 'Pão, Filé, Mussarela, Milho, Batata, Alface e Tomate.', image: 'https://images.unsplash.com/photo-1603064750555-408eab413e14?auto=format&fit=crop&w=500&q=60' },
  { id: 25, name: 'X Frango (Pão Sírio)', price: 36.00, category: 'Pão Sírio', desc: 'Pão sírio no prato, filé de frango, mussarela, milho, alface e tomate.', image: 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?auto=format&fit=crop&w=500&q=60' },
  { id: 26, name: 'X Filé Mignon (Pão Sírio)', price: 40.00, category: 'Pão Sírio', desc: 'Pão sírio no prato, filé mignon, mussarela, milho, alface e tomate.', image: 'https://images.unsplash.com/photo-1561651823-34958019cd2a?auto=format&fit=crop&w=500&q=60' },
  { id: 27, name: 'Misto Quente', price: 13.00, category: 'Diversos', desc: 'Pão, presunto e mussarela.', image: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=500&q=60' },
  { id: 28, name: 'X Dog Simples', price: 20.00, category: 'Diversos', desc: 'Pão, ovo, 2 salsichas, presunto, mussarela, milho, batata, alface e tomate.', image: 'https://images.unsplash.com/photo-1612392062631-94dd85fa2dd0?auto=format&fit=crop&w=500&q=60' },
  { id: 29, name: 'X Dog Bacon', price: 21.00, category: 'Diversos', desc: 'Pão, ovo, salsicha, bacon, presunto, mussarela, milho, batata, alface e tomate.', image: 'https://images.unsplash.com/photo-1612392062631-94dd85fa2dd0?auto=format&fit=crop&w=500&q=60' },
  { id: 33, name: 'Batata Frita Individual', price: 6.00, category: 'Porções', desc: 'Porção individual de batata frita.', image: 'https://images.unsplash.com/photo-1630384060421-cb20d0e0649d?auto=format&fit=crop&w=500&q=60' },
  { id: 34, name: 'Batata Frita (Meia)', price: 10.00, category: 'Porções', desc: 'Meia porção de batata frita tradicional.', image: 'https://images.unsplash.com/photo-1630384060421-cb20d0e0649d?auto=format&fit=crop&w=500&q=60' },
  { id: 35, name: 'Batata Frita (Inteira)', price: 20.00, category: 'Porções', desc: 'Porção inteira de batata frita tradicional.', image: 'https://images.unsplash.com/photo-1630384060421-cb20d0e0649d?auto=format&fit=crop&w=500&q=60' },
  { id: 36, name: 'Batata Frita Especial (Meia)', price: 15.00, category: 'Porções', desc: 'Mussarela, Cheddar e Bacon.', image: 'https://images.unsplash.com/photo-1573080496987-a199f8cd75ec?auto=format&fit=crop&w=500&q=60' },
  { id: 37, name: 'Batata Frita Especial (Inteira)', price: 30.00, category: 'Porções', desc: 'Mussarela, Cheddar e Bacon.', image: 'https://images.unsplash.com/photo-1573080496987-a199f8cd75ec?auto=format&fit=crop&w=500&q=60' },
  { id: 38, name: 'Batata Frita c/ Filé Mignon (Meia)', price: 20.00, category: 'Porções', desc: 'Mussarela, Catupiry e Filé Mignon.', image: 'https://images.unsplash.com/photo-1573080496987-a199f8cd75ec?auto=format&fit=crop&w=500&q=60' },
  { id: 39, name: 'Batata Frita c/ Filé Mignon (Inteira)', price: 40.00, category: 'Porções', desc: 'Mussarela, Catupiry e Filé Mignon.', image: 'https://images.unsplash.com/photo-1573080496987-a199f8cd75ec?auto=format&fit=crop&w=500&q=60' },
  { id: 30, name: 'Refrigerante Lata', price: 7.00, category: 'Bebidas', desc: '350ml gelada.', image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=500&q=60' },
  { id: 56, name: 'Refrigerante 600ml', price: 8.00, category: 'Bebidas', desc: 'Garrafa.', image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=500&q=60' },
  { id: 57, name: 'Refrigerante 1L', price: 10.00, category: 'Bebidas', desc: 'Garrafa.', image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=500&q=60' },
  { id: 58, name: 'Refrigerante 1.5L', price: 13.00, category: 'Bebidas', desc: 'Garrafa.', image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=500&q=60' },
  { id: 59, name: 'Refrigerante 2L', price: 15.00, category: 'Bebidas', desc: 'Garrafa.', image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=500&q=60' },
  { id: 60, name: 'Suco de Lata', price: 7.00, category: 'Bebidas', desc: 'Sabores variados.', image: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&w=500&q=60' },
  { id: 32, name: 'Água s/ Gás', price: 4.00, category: 'Bebidas', desc: '500ml.', image: 'https://images.unsplash.com/photo-1548839140-29a749e1bc4e?auto=format&fit=crop&w=500&q=60' },
  { id: 61, name: 'Água c/ Gás', price: 4.00, category: 'Bebidas', desc: '500ml.', image: 'https://images.unsplash.com/photo-1548839140-29a749e1bc4e?auto=format&fit=crop&w=500&q=60' },
  { id: 62, name: 'Cerveja Lata', price: 6.00, category: 'Bebidas', desc: '350ml.', image: 'https://images.unsplash.com/photo-1614316654407-7422119dcb69?auto=format&fit=crop&w=500&q=60' },
  { id: 63, name: 'Cerveja Longneck', price: 10.90, category: 'Bebidas', desc: 'Garrafa.', image: 'https://images.unsplash.com/photo-1614316654407-7422119dcb69?auto=format&fit=crop&w=500&q=60' },
  { id: 70, name: 'Suco de Morango', price: 11.00, category: 'Sucos', desc: '500ml com 2 polpas.', image: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&w=500&q=60' },
  { id: 71, name: 'Suco de Maracujá', price: 11.00, category: 'Sucos', desc: '500ml com 2 polpas.', image: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&w=500&q=60' },
  { id: 72, name: 'Suco de Cupuaçu', price: 11.00, category: 'Sucos', desc: '500ml com 2 polpas.', image: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&w=500&q=60' },
  { id: 73, name: 'Suco de Açaí', price: 11.00, category: 'Sucos', desc: '500ml com 2 polpas.', image: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&w=500&q=60' },
  { id: 74, name: 'Suco de Uva', price: 11.00, category: 'Sucos', desc: '500ml com 2 polpas.', image: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&w=500&q=60' },
  { id: 75, name: 'Suco de Abacaxi', price: 11.00, category: 'Sucos', desc: '500ml com 2 polpas.', image: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&w=500&q=60' },
  { id: 76, name: 'Suco de Abacaxi c/ Hortelã', price: 11.00, category: 'Sucos', desc: '500ml com 2 polpas.', image: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&w=500&q=60' },
  { id: 77, name: 'Suco de Acerola', price: 11.00, category: 'Sucos', desc: '500ml com 2 polpas.', image: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&w=500&q=60' },
  { id: 78, name: 'Suco de Laranja', price: 11.00, category: 'Sucos', desc: '500ml natural.', image: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&w=500&q=60' },
  { id: 80, name: 'Creme de Morango', price: 16.00, category: 'Cremes', desc: '500ml com 2 polpas + Leite Cond.', image: 'https://images.unsplash.com/photo-1553530666-ba11a7da3888?auto=format&fit=crop&w=500&q=60' },
  { id: 81, name: 'Creme de Maracujá', price: 16.00, category: 'Cremes', desc: '500ml com 2 polpas + Leite Cond.', image: 'https://images.unsplash.com/photo-1553530666-ba11a7da3888?auto=format&fit=crop&w=500&q=60' },
  { id: 82, name: 'Creme de Cupuaçu', price: 16.00, category: 'Cremes', desc: '500ml com 2 polpas + Leite Cond.', image: 'https://images.unsplash.com/photo-1553530666-ba11a7da3888?auto=format&fit=crop&w=500&q=60' },
  { id: 83, name: 'Creme de Açaí', price: 16.00, category: 'Cremes', desc: '500ml com 2 polpas + Leite Cond.', image: 'https://images.unsplash.com/photo-1553530666-ba11a7da3888?auto=format&fit=crop&w=500&q=60' },
  { id: 84, name: 'Creme de Uva', price: 16.00, category: 'Cremes', desc: '500ml com 2 polpas + Leite Cond.', image: 'https://images.unsplash.com/photo-1553530666-ba11a7da3888?auto=format&fit=crop&w=500&q=60' },
  { id: 85, name: 'Creme de Abacaxi', price: 16.00, category: 'Cremes', desc: '500ml com 2 polpas + Leite Cond.', image: 'https://images.unsplash.com/photo-1553530666-ba11a7da3888?auto=format&fit=crop&w=500&q=60' },
  { id: 86, name: 'Creme de Abacaxi c/ Hortelã', price: 16.00, category: 'Cremes', desc: '500ml com 2 polpas + Leite Cond.', image: 'https://images.unsplash.com/photo-1553530666-ba11a7da3888?auto=format&fit=crop&w=500&q=60' },
  { id: 87, name: 'Creme de Acerola', price: 16.00, category: 'Cremes', desc: '500ml com 2 polpas + Leite Cond.', image: 'https://images.unsplash.com/photo-1553530666-ba11a7da3888?auto=format&fit=crop&w=500&q=60' },
];

const CATEGORIES = ["Todos", "Hambúrguer", "Frango", "Lombo", "Filé Mignon", "Pão Sírio", "Diversos", "Porções", "Bebidas", "Sucos", "Cremes"];

const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

const playNotificationSound = () => {
  const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
  audio.play().catch(e => console.log('Erro ao tocar som:', e));
};

export default function DeliveryApp() {
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [appTab, setAppTab] = useState<'menu' | 'history'>('menu');
  
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authName, setAuthName] = useState('');
  const [authError, setAuthError] = useState('');
  const [authInProcess, setAuthInProcess] = useState(false);

  const [activeCategory, setActiveCategory] = useState("Todos");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState<'cart' | 'form' | 'success'>('cart');
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  
  const [isOpen, setIsOpen] = useState(true);

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [modalQty, setModalQty] = useState(1);
  const [removedIngredients, setRemovedIngredients] = useState<string[]>([]);
  const [addOns, setAddOns] = useState<AddOn[]>([]);
  const [itemNote, setItemNote] = useState('');

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [cep, setCep] = useState('');
  const [street, setStreet] = useState('');
  const [number, setNumber] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [complement, setComplement] = useState('');
  const [fetchingCep, setFetchingCep] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('pix');
  const [orderNote, setOrderNote] = useState('');

  const [myOrders, setMyOrders] = useState<OrderData[]>([]);
  const prevStatuses = useRef<Record<string, string>>({});
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser?.displayName) {
        setCustomerName(currentUser.displayName);
      }
      setAuthLoading(false);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!user) return;
    
    const q = query(collection(db, 'users', RESTAURANT_OWNER_ID, 'orders'), where('customerId', '==', user.uid));
    const unsub = onSnapshot(q, (snapshot) => {
      const fetchedOrders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as OrderData));
      
      fetchedOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setMyOrders(fetchedOrders);

      fetchedOrders.forEach(order => {
        const prevStatus = prevStatuses.current[order.id!];
        
        if (prevStatus && prevStatus !== order.status) {
          playNotificationSound();
          
          let statusText = '';
          if (order.status === 'preparing') statusText = 'Seu pedido começou a ser preparado!';
          if (order.status === 'done') statusText = 'Seu pedido está pronto / saiu para entrega!';
          if (order.status === 'ready') statusText = 'Pedido finalizado. Bom apetite!';
          
          setToastMessage(statusText);
          setTimeout(() => setToastMessage(''), 5000);
        }
        prevStatuses.current[order.id!] = order.status;
      });
    });

    return () => unsub();
  }, [user]);

  useEffect(() => {
    const checkBusinessHours = () => {
      const now = new Date();
      const currentMinutes = now.getHours() * 60 + now.getMinutes();
      const openTime = 18 * 60 + 30; // 18:30
      const closeTime = 23 * 60 + 30; // 23:30
      setIsOpen(currentMinutes >= openTime && currentMinutes <= closeTime);
    };
    checkBusinessHours(); 
    const interval = setInterval(checkBusinessHours, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthInProcess(true);
    try {
      await setPersistence(auth, browserLocalPersistence);

      if (authMode === 'login') {
        await signInWithEmailAndPassword(auth, authEmail, authPassword);
      } else {
        const userCred = await createUserWithEmailAndPassword(auth, authEmail, authPassword);
        await updateProfile(userCred.user, { displayName: authName });
        setCustomerName(authName);
      }
    } catch (err: any) {
      setAuthError("Erro: Verifique seus dados ou tente novamente.");
    } finally {
      setAuthInProcess(false);
    }
  };

  const handleResetPassword = async () => {
    if (!authEmail) {
      setAuthError("Por favor, digite seu email no campo acima primeiro.");
      return;
    }
    try {
      setAuthInProcess(true);
      await sendPasswordResetEmail(auth, authEmail);
      alert("Email de recuperação enviado! Verifique sua caixa de entrada (e a aba de spam).");
      setAuthError('');
    } catch (err: any) {
      setAuthError("Erro ao enviar email. Verifique se o endereço está correto.");
    } finally {
      setAuthInProcess(false);
    }
  };

  const handleLogout = () => {
    signOut(auth);
    setAppTab('menu');
  };

  const openProductModal = (product: Product) => {
    if (!isOpen) return alert("Estamos fechados no momento! Nosso horário de funcionamento é das 18:30 às 23:30.");
    setSelectedProduct(product);
    setModalQty(1);
    setRemovedIngredients([]);
    setAddOns([]);
    setItemNote('');
  };

  const closeProductModal = () => {
    setSelectedProduct(null);
  };

  const onCepChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 8) value = value.slice(0, 8);
    
    const formatted = value.replace(/^(\d{5})(\d)/, '$1-$2');
    setCep(formatted);

    if (value.length === 8) {
      setFetchingCep(true);
      try {
        const res = await fetch(`https://viacep.com.br/ws/${value}/json/`);
        const data = await res.json();
        if (!data.erro) {
          setStreet(data.logradouro || '');
          setNeighborhood(data.bairro || '');
          document.getElementById('addressNumber')?.focus(); 
        } else {
          alert("CEP não encontrado.");
        }
      } catch (err) {
        console.error("Erro ao buscar CEP", err);
      } finally {
        setFetchingCep(false);
      }
    }
  };

  const toggleIngredient = (ingId: string) => {
    if (removedIngredients.includes(ingId)) setRemovedIngredients(prev => prev.filter(id => id !== ingId));
    else setRemovedIngredients(prev => [...prev, ingId]);
  };

  const handleAddAddOn = (addon: AddOn) => {
    setAddOns(prev => {
      const existing = prev.find(a => a.id === addon.id);
      if (existing) return prev.map(a => a.id === addon.id ? { ...a, qty: (a.qty || 1) + 1 } : a);
      return [...prev, { ...addon, qty: 1 }];
    });
  };

  const handleRemoveAddOn = (addonId: string) => {
    setAddOns(prev => {
      const existing = prev.find(a => a.id === addonId);
      if (existing && (existing.qty || 1) > 1) return prev.map(a => a.id === addonId ? { ...a, qty: (a.qty || 1) - 1 } : a);
      return prev.filter(a => a.id !== addonId);
    });
  };

  const confirmAddToCart = () => {
    if (!selectedProduct) return;
    const addonsTotal = addOns.reduce((acc, curr) => acc + (curr.price * (curr.qty || 1)), 0);
    const unitPrice = selectedProduct.price + addonsTotal;
    const newItem: CartItem = { ...selectedProduct, qty: modalQty, cartItemId: Math.random().toString(36).substr(2, 9), removedIngredients, addOns, finalPrice: unitPrice, note: itemNote };
    setCart(prev => [...prev, newItem]);
    setSelectedProduct(null);
  };

  const removeFromCart = (cartItemId: string) => setCart(prev => prev.filter(item => item.cartItemId !== cartItemId));
  
  const handleReorder = (order: OrderData) => {
    if (!isOpen) return alert("Estamos fechados no momento!");
    
    const newItems = order.items.map(item => ({
      ...item,
      cartItemId: Math.random().toString(36).substr(2, 9)
    }));
    
    setCart(newItems);
    
    setStreet(order.address || '');
    setCep('');
    setNumber('');
    setNeighborhood('');
    setComplement('');
    setCustomerPhone(order.phone || '');
    setPaymentMethod(order.paymentMethod || 'pix');
    setAppTab('menu');
    setIsCartOpen(true);
    setCheckoutStep('cart');
  };

  const cartTotal = cart.reduce((acc, item) => acc + (item.finalPrice * item.qty), 0);
  const deliveryFee = 5.00; 

  const handleFinishAndWhatsApp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return alert("Você precisa estar logado para fazer um pedido.");
    setLoading(true);

    const orderNumber = Math.floor(Math.random() * 9000) + 1000;
    const finalTotal = cartTotal + deliveryFee;
    
    const fullAddress = `${street}, ${number} - ${neighborhood}${complement ? ` (${complement})` : ''} - CEP: ${cep}`;

    const orderData: OrderData = {
      orderNumber,
      customerId: user.uid,
      customerName,
      phone: customerPhone,
      address: fullAddress,
      deliveryFee,
      items: cart, 
      total: finalTotal,
      paymentMethod,
      notes: orderNote,
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    try {
      await addDoc(collection(db, 'users', RESTAURANT_OWNER_ID, 'orders'), orderData);
      
      let message = `*NOVO PEDIDO - DELIVERY PAPITOS* 🍔\n`;
      message += `--------------------------------\n`;
      message += `👤 *Cliente:* ${customerName}\n`;
      message += `📍 *Endereço:* ${fullAddress}\n`;
      message += `📱 *Telefone:* ${customerPhone}\n\n`;
      message += `*ITENS DO PEDIDO:*\n`;
      cart.forEach(item => {
        message += `${item.qty}x ${item.name} (${formatCurrency(item.finalPrice)})\n`;
        if (item.removedIngredients.length > 0) item.removedIngredients.forEach(ing => message += `   ⛔ Sem ${STOCK_NAMES[ing] || ing}\n`);
        if (item.addOns.length > 0) item.addOns.forEach(add => message += `   ➕ ${add.qty}x ${add.name}\n`);
        if (item.note) message += `   📝 ${item.note}\n`;
        message += `\n`;
      });
      if (orderNote) message += `\n📝 *Obs Geral:* ${orderNote}\n`;
      message += `\n🛵 *Taxa Entrega:* ${formatCurrency(deliveryFee)}`;
      message += `\n💰 *TOTAL:* ${formatCurrency(finalTotal)}`;
      message += `\n💳 *Pagamento:* ${paymentMethod.toUpperCase()}`;
      message += `\n--------------------------------\n`;
      message += `Aguardo confirmação!`;

      const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, '_blank');

      setCheckoutStep('success');
      setCart([]);
    } catch (error) {
      alert("Erro ao enviar pedido.");
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = MENU_ITEMS.filter(item => (activeCategory === "Todos" || item.category === activeCategory) && item.name.toLowerCase().includes(search.toLowerCase()));

  if (authLoading) return <div className="h-screen bg-zinc-950 flex justify-center items-center"><div className="w-10 h-10 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin"></div></div>;

  if (!user) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col items-center justify-center p-6">
        <style>{`
          input:-webkit-autofill,
          input:-webkit-autofill:hover,
          input:-webkit-autofill:focus,
          input:-webkit-autofill:active {
              -webkit-box-shadow: 0 0 0 30px #09090b inset !important;
              -webkit-text-fill-color: white !important;
              transition: background-color 5000s ease-in-out 0s;
          }
        `}</style>
        <div className="w-full max-w-sm bg-zinc-900 border border-zinc-800 p-8 rounded-2xl shadow-2xl">
          <div className="flex flex-col items-center mb-8">
            <div className="w-20 h-20 bg-zinc-950 rounded-full border-2 border-yellow-500 flex items-center justify-center mb-4 overflow-hidden shadow-lg shadow-yellow-500/20">
               <img src="/logopapitos.png" alt="Papitos" className="w-full h-full object-contain scale-110" />
            </div>
            <h2 className="text-2xl font-bold text-white">Papitos Delivery</h2>
            <p className="text-zinc-400 text-sm">
              {authMode === 'login' ? 'Faça login para pedir' : 'Crie sua conta'}
            </p>
          </div>

          <form onSubmit={handleAuth} className="space-y-4">
            {authMode === 'register' && (
              <div>
                <label className="text-xs font-bold text-zinc-500 uppercase ml-1">Seu Nome</label>
                <div className="flex items-center bg-zinc-950 border border-zinc-800 rounded-lg px-3 mt-1"><User size={18} className="text-zinc-600 mr-2" /><input required type="text" className="bg-transparent w-full py-3 outline-none text-sm text-white" value={authName} onChange={e => setAuthName(e.target.value)} /></div>
              </div>
            )}
            <div>
              <label className="text-xs font-bold text-zinc-500 uppercase ml-1">Email</label>
              <div className="flex items-center bg-zinc-950 border border-zinc-800 rounded-lg px-3 mt-1"><Mail size={18} className="text-zinc-600 mr-2" /><input required type="email" className="bg-transparent w-full py-3 outline-none text-sm text-white" value={authEmail} onChange={e => setAuthEmail(e.target.value)} /></div>
            </div>
            <div>
              <label className="text-xs font-bold text-zinc-500 uppercase ml-1">Senha</label>
              <div className="flex items-center bg-zinc-950 border border-zinc-800 rounded-lg px-3 mt-1"><Lock size={18} className="text-zinc-600 mr-2" /><input required type="password" minLength={6} className="bg-transparent w-full py-3 outline-none text-sm text-white" value={authPassword} onChange={e => setAuthPassword(e.target.value)} /></div>
            </div>
            
            {authMode === 'login' && (
              <div className="text-center mt-2">
                <button type="button" onClick={handleResetPassword} disabled={authInProcess} className="text-sm text-zinc-400 hover:text-yellow-500 transition font-medium">Esqueceu sua senha?</button>
              </div>
            )}
            
            {authError && <div className="text-red-400 text-xs bg-red-900/20 p-2 rounded border border-red-500/20 flex items-center gap-2"><AlertCircle size={14}/>{authError}</div>}
            
            <button type="submit" disabled={authInProcess} className="w-full bg-yellow-600 text-black font-bold py-3.5 rounded-lg hover:bg-yellow-500 transition shadow-lg shadow-yellow-900/20 disabled:opacity-50">
              {authInProcess ? 'Aguarde...' : (authMode === 'login' ? 'ENTRAR' : 'CRIAR CONTA')}
            </button>
          </form>

          <p className="text-center text-sm text-zinc-500 mt-6">
            {authMode === 'login' ? "Ainda não tem conta? " : "Já tem conta? "}
            <button onClick={() => {setAuthMode(authMode === 'login' ? 'register' : 'login'); setAuthError('');}} className="text-yellow-500 font-bold hover:underline">
              {authMode === 'login' ? 'Cadastre-se' : 'Faça Login'}
            </button>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 font-sans pb-24 text-zinc-100 selection:bg-yellow-500/30">
      
      {toastMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] bg-green-500 text-white px-5 py-3 rounded-full font-bold text-sm shadow-2xl flex items-center gap-2 animate-in slide-in-from-top fade-in duration-300 border-2 border-green-400">
          <BellRing size={18} className="animate-bounce" /> {toastMessage}
        </div>
      )}

      <header className="bg-zinc-950/80 backdrop-blur-md border-b border-zinc-800 p-4 sticky top-0 z-30">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 shrink-0 bg-zinc-900 rounded-full flex items-center justify-center border-2 border-yellow-500 shadow-lg overflow-hidden">
               <img src="/logopapitos.png" alt="Papitos" className="w-full h-full object-contain scale-110" />
            </div>
            <div>
              <h1 className="font-bold text-xl leading-none text-white tracking-tight">Papitos</h1>
              {isOpen ? (
                <p className="text-xs text-yellow-500 font-bold flex items-center gap-1 mt-1"><span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>Aberto até 23:30</p>
              ) : (
                <p className="text-xs text-red-500 font-bold flex items-center gap-1 mt-1"><span className="w-2 h-2 bg-red-600 rounded-full"></span>Fechado - Abre às 18:30</p>
              )}
            </div>
          </div>
          
          <button onClick={() => { if(!isOpen && cart.length === 0) return alert("Estamos fechados!"); setIsCartOpen(true); }} className="relative p-3 bg-zinc-900 rounded-xl border border-zinc-800 hover:border-yellow-500/50 transition group">
            <ShoppingBag size={24} className="text-zinc-400 group-hover:text-yellow-500 transition" />
            {cart.length > 0 && <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-zinc-950">{cart.reduce((a,c) => a + c.qty, 0)}</span>}
          </button>
        </div>
      </header>

      {!isOpen && appTab === 'menu' && (
        <div className="bg-red-600/10 border-b border-red-500/20 p-3 flex items-center justify-center gap-2 text-red-400 text-sm font-bold"><AlertCircle size={18} />Estamos fechados no momento.</div>
      )}

      {appTab === 'menu' && (
        <>
          <div className="bg-zinc-950 p-4 sticky top-20 z-20 shadow-xl shadow-black/20">
            <div className="max-w-4xl mx-auto space-y-4">
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-yellow-500 transition" size={20} />
                <input type="text" placeholder="O que você quer comer hoje?" className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-3 pl-10 pr-4 text-sm text-white outline-none focus:border-yellow-500/50 transition placeholder-zinc-600" value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                {CATEGORIES.map(cat => (
                  <button key={cat} onClick={() => setActiveCategory(cat)} className={`px-5 py-2 rounded-full text-sm font-bold whitespace-nowrap transition border ${activeCategory === cat ? 'bg-yellow-600 text-black border-yellow-500 shadow-lg' : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:bg-zinc-800 hover:text-white'}`}>{cat}</button>
                ))}
              </div>
            </div>
          </div>

          <main className="max-w-4xl mx-auto p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredItems.map(item => (
                <div key={item.id} onClick={() => openProductModal(item)} className={`p-4 rounded-2xl border flex gap-4 transition group relative overflow-hidden cursor-pointer ${isOpen ? 'bg-zinc-900 border-zinc-800 hover:border-zinc-700 active:scale-[0.98]' : 'bg-zinc-900/50 border-zinc-800/50 opacity-70 grayscale'}`}>
                  <div className="w-28 h-28 shrink-0 rounded-xl overflow-hidden bg-zinc-800"><img src={item.image} alt={item.name} className={`w-full h-full object-cover transition duration-500 ${isOpen ? 'group-hover:scale-110' : ''}`} /></div>
                  <div className="flex-1 flex flex-col justify-between">
                    <div><h3 className="font-bold text-lg text-zinc-100 leading-tight">{item.name}</h3><p className="text-xs text-zinc-500 line-clamp-2 mt-1 leading-relaxed">{item.desc}</p></div>
                    <div className="flex justify-between items-end mt-3">
                      <span className="font-bold text-yellow-500 text-lg">{formatCurrency(item.price)}</span>
                      {isOpen ? <div className="bg-zinc-800 text-white p-2 rounded-lg group-hover:bg-yellow-600 group-hover:text-black transition"><Plus size={18} /></div> : <div className="bg-red-900/30 text-red-500 text-[10px] font-bold px-2 py-1 rounded border border-red-500/20">FECHADO</div>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </main>
        </>
      )}

      {appTab === 'history' && (
        <main className="max-w-4xl mx-auto p-4 space-y-4">
          <div className="flex justify-between items-center mb-6">
             <h2 className="text-2xl font-bold text-white flex items-center gap-2"><History className="text-yellow-500"/> Meus Pedidos</h2>
             <button onClick={handleLogout} className="text-xs text-zinc-400 flex items-center gap-1 hover:text-red-400"><LogOut size={14}/> Sair da Conta</button>
          </div>

          {myOrders.length === 0 ? (
            <div className="text-center py-20 text-zinc-600">
               <ShoppingBag size={64} className="mx-auto mb-4 opacity-20" />
               <p className="text-lg">Você ainda não tem pedidos.</p>
               <button onClick={() => setAppTab('menu')} className="mt-4 text-yellow-500 font-bold hover:underline">Ver Cardápio</button>
            </div>
          ) : (
            myOrders.map(order => (
              <div key={order.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-lg">
                 <div className="p-4 bg-zinc-950/50 border-b border-zinc-800 flex justify-between items-start">
                    <div>
                      <span className="text-zinc-500 font-mono text-sm font-bold">#{order.orderNumber}</span>
                      <p className="text-xs text-zinc-400 mt-1"><Clock size={12} className="inline mr-1"/> {new Date(order.createdAt).toLocaleString('pt-BR')}</p>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-yellow-500 text-lg block">{formatCurrency(order.total)}</span>
                      {order.status === 'pending' && <span className="text-[10px] bg-zinc-800 text-zinc-400 px-2 py-1 rounded font-bold uppercase">Aguardando Aceite</span>}
                      {order.status === 'preparing' && <span className="text-[10px] bg-yellow-900/30 border border-yellow-500/30 text-yellow-500 px-2 py-1 rounded font-bold uppercase animate-pulse">Preparando</span>}
                      {order.status === 'done' && <span className="text-[10px] bg-blue-900/30 border border-blue-500/30 text-blue-400 px-2 py-1 rounded font-bold uppercase animate-pulse">Saiu / Pronto</span>}
                      {order.status === 'ready' && <span className="text-[10px] bg-green-900/30 border border-green-500/30 text-green-500 px-2 py-1 rounded font-bold uppercase">Entregue</span>}
                    </div>
                 </div>
                 
                 {order.status !== 'ready' && (
                    <div className="px-6 py-4 bg-zinc-900/80 border-b border-zinc-800 flex justify-between items-center relative">
                       <div className="absolute top-1/2 left-10 right-10 h-0.5 bg-zinc-800 -translate-y-1/2 z-0"></div>
                       
                       <div className="relative z-10 flex flex-col items-center gap-1">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${['pending', 'preparing', 'done', 'ready'].includes(order.status) ? 'bg-yellow-600 border-yellow-500 text-black' : 'bg-zinc-900 border-zinc-700 text-zinc-600'}`}><Clock size={14}/></div>
                          <span className="text-[10px] font-bold text-zinc-400">Aceite</span>
                       </div>
                       <div className="relative z-10 flex flex-col items-center gap-1">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${['preparing', 'done', 'ready'].includes(order.status) ? 'bg-yellow-600 border-yellow-500 text-black' : 'bg-zinc-900 border-zinc-700 text-zinc-600'}`}><ChefHat size={14}/></div>
                          <span className="text-[10px] font-bold text-zinc-400">Preparo</span>
                       </div>
                       <div className="relative z-10 flex flex-col items-center gap-1">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${['done', 'ready'].includes(order.status) ? 'bg-blue-600 border-blue-500 text-white' : 'bg-zinc-900 border-zinc-700 text-zinc-600'}`}><Bike size={14}/></div>
                          <span className="text-[10px] font-bold text-zinc-400">Entrega</span>
                       </div>
                    </div>
                 )}

                 <div className="p-4 space-y-2">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="text-sm text-zinc-300 flex items-start gap-2">
                        <span className="text-zinc-500 font-bold">{item.qty}x</span>
                        <div>
                           <span>{item.name}</span>
                           {(item.removedIngredients?.length > 0 || item.addOns?.length > 0) && (
                              <div className="text-[10px] text-zinc-500 mt-0.5">
                                {item.removedIngredients.map(ing => <span key={ing} className="block">- sem {STOCK_NAMES[ing] || ing}</span>)}
                                {item.addOns.map(add => <span key={add.id} className="block">+ {add.qty}x {add.name}</span>)}
                              </div>
                           )}
                        </div>
                      </div>
                    ))}
                 </div>
                 
                 <div className="p-4 bg-zinc-950/30 border-t border-zinc-800">
                    <button onClick={() => handleReorder(order)} className="w-full py-3 bg-zinc-800 hover:bg-yellow-600 hover:text-black text-white font-bold rounded-xl transition flex items-center justify-center gap-2">
                       <RefreshCw size={18} /> REFAZER ESTE PEDIDO
                    </button>
                 </div>
              </div>
            ))
          )}
        </main>
      )}

      <nav className="fixed bottom-0 left-0 right-0 bg-zinc-950 border-t border-zinc-800 flex justify-around items-center h-16 z-40 pb-safe">
         <button onClick={() => setAppTab('menu')} className={`flex flex-col items-center gap-1 w-full h-full justify-center transition ${appTab === 'menu' ? 'text-yellow-500' : 'text-zinc-500 hover:text-zinc-300'}`}>
            <MenuIcon size={20} />
            <span className="text-[10px] font-bold">Cardápio</span>
         </button>
         <button onClick={() => setAppTab('history')} className={`flex flex-col items-center gap-1 w-full h-full justify-center transition relative ${appTab === 'history' ? 'text-yellow-500' : 'text-zinc-500 hover:text-zinc-300'}`}>
            <History size={20} />
            <span className="text-[10px] font-bold">Meus Pedidos</span>
            {myOrders.some(o => o.status !== 'ready') && <span className="absolute top-2 right-[30%] w-2 h-2 bg-red-500 rounded-full"></span>}
         </button>
      </nav>

      {selectedProduct && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-4 animate-in fade-in">
          <div className="bg-zinc-900 w-full max-w-lg rounded-t-3xl md:rounded-3xl border border-zinc-800 flex flex-col max-h-[90vh] shadow-2xl animate-in slide-in-from-bottom duration-300">
            <div className="p-5 border-b border-zinc-800 flex justify-between items-center bg-zinc-950/50 rounded-t-3xl shrink-0">
               <div><h3 className="text-xl font-bold text-white">{selectedProduct.name}</h3><p className="text-yellow-500 font-bold">{formatCurrency(selectedProduct.price)}</p></div>
               <button onClick={closeProductModal} className="p-2 bg-zinc-800 rounded-full hover:bg-zinc-700"><X size={20} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 custom-scrollbar space-y-6">
               {RECIPES[selectedProduct.id] && (
                 <div>
                   <h4 className="text-xs font-bold text-zinc-500 uppercase mb-3 flex items-center gap-2"><Minus size={14} className="text-red-500"/> Retirar Ingredientes</h4>
                   <div className="grid grid-cols-2 gap-2">
                     {Object.keys(RECIPES[selectedProduct.id]).map(ingKey => (
                       <button key={ingKey} onClick={() => toggleIngredient(ingKey)} className={`text-xs p-3 rounded-lg border flex justify-between items-center transition ${removedIngredients.includes(ingKey) ? 'bg-red-900/20 border-red-500 text-red-200' : 'bg-zinc-950 border-zinc-800 text-zinc-400'}`}>
                         {STOCK_NAMES[ingKey] || ingKey}{removedIngredients.includes(ingKey) && <X size={14} />}
                       </button>
                     ))}
                   </div>
                 </div>
               )}
               <div>
                 <h4 className="text-xs font-bold text-zinc-500 uppercase mb-3 flex items-center gap-2"><Plus size={14} className="text-yellow-500"/> Adicionar Extras</h4>
                 <div className="space-y-2">
                   {AVAILABLE_ADDONS.map(addon => {
                     const currentAddon = addOns.find(a => a.id === addon.id);
                     const qty = currentAddon?.qty || 0;
                     return (
                       <div key={addon.id} className={`flex justify-between items-center p-3 rounded-lg border transition ${qty > 0 ? 'bg-yellow-900/10 border-yellow-600/50' : 'bg-zinc-950 border-zinc-800'}`}>
                         <div><p className={`text-sm font-bold ${qty > 0 ? 'text-white' : 'text-zinc-400'}`}>{addon.name}</p><p className="text-xs text-yellow-500">+{formatCurrency(addon.price)}</p></div>
                         <div className="flex items-center gap-3 bg-zinc-900 p-1 rounded-lg border border-zinc-800">
                           <button type="button" onClick={(e) => { e.stopPropagation(); handleRemoveAddOn(addon.id); }} className="p-1 hover:text-white text-zinc-500"><Minus size={16}/></button>
                           <span className="text-sm font-bold w-4 text-center">{qty}</span>
                           <button type="button" onClick={(e) => { e.stopPropagation(); handleAddAddOn(addon); }} className="p-1 hover:text-yellow-500 text-zinc-300"><Plus size={16}/></button>
                         </div>
                       </div>
                     );
                   })}
                 </div>
               </div>
               <div>
                 <h4 className="text-xs font-bold text-zinc-500 uppercase mb-2">Observação do Item</h4>
                 <textarea rows={2} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-sm text-white outline-none focus:border-yellow-500" placeholder="Ex: Carne bem passada..." value={itemNote} onChange={e => setItemNote(e.target.value)} />
               </div>
            </div>
            <div className="p-5 border-t border-zinc-800 bg-zinc-900 rounded-b-3xl shrink-0">
               <div className="flex justify-between items-center mb-4">
                 <div className="flex items-center gap-3 bg-zinc-950 p-2 rounded-xl border border-zinc-800">
                    <button onClick={() => setModalQty(Math.max(1, modalQty - 1))} className="p-2 hover:text-white text-zinc-500"><Minus size={20}/></button>
                    <span className="text-lg font-bold w-6 text-center">{modalQty}</span>
                    <button onClick={() => setModalQty(modalQty + 1)} className="p-2 hover:text-yellow-500 text-zinc-300"><Plus size={20}/></button>
                 </div>
                 <div className="text-right">
                   <p className="text-xs text-zinc-500 uppercase">Total</p>
                   <p className="text-2xl font-bold text-yellow-500">{formatCurrency((selectedProduct.price + addOns.reduce((a, c) => a + (c.price * (c.qty || 1)), 0)) * modalQty)}</p>
                 </div>
               </div>
               <button onClick={confirmAddToCart} className="w-full bg-yellow-600 text-black font-bold py-4 rounded-xl hover:bg-yellow-500 transition shadow-lg active:scale-95">ADICIONAR À SACOLA</button>
            </div>
          </div>
        </div>
      )}

      {isCartOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end md:items-center justify-center animate-in fade-in">
          <div className="bg-zinc-900 w-full max-w-lg h-[95vh] md:h-auto md:max-h-[90vh] md:rounded-3xl rounded-t-3xl flex flex-col shadow-2xl border border-zinc-800 animate-in slide-in-from-bottom duration-300">
            <div className="p-6 border-b border-zinc-800 flex justify-between items-center bg-zinc-900 rounded-t-3xl">
              <h2 className="font-bold text-xl text-white flex items-center gap-3">{checkoutStep === 'cart' ? <><ShoppingBag className="text-yellow-500" /> Sua Sacola</> : <><CheckCircle className="text-yellow-500" /> Finalizar Pedido</>}</h2>
              <button onClick={() => { setIsCartOpen(false); setCheckoutStep('cart'); }} className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded-full text-zinc-400 hover:text-white transition"><X size={24} /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-zinc-600 space-y-4">
                  <ShoppingBag size={64} className="opacity-20" />
                  <p className="text-lg font-medium">Sua sacola está vazia</p>
                  <button onClick={() => setIsCartOpen(false)} className="text-yellow-500 font-bold hover:underline">Voltar ao cardápio</button>
                </div>
              ) : (
                <>
                  {checkoutStep === 'cart' ? (
                    <div className="space-y-4">
                      {cart.map(item => (
                        <div key={item.cartItemId} className="bg-zinc-950/50 p-4 rounded-xl border border-zinc-800/50 flex flex-col gap-3">
                          <div className="flex justify-between items-start">
                            <div className="flex gap-4 items-center">
                              <div className="bg-zinc-800 w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm text-zinc-400 border border-zinc-700">{item.qty}x</div>
                              <div><p className="font-bold text-base text-zinc-200">{item.name}</p><p className="text-sm text-yellow-500 font-bold">{formatCurrency(item.finalPrice * item.qty)}</p></div>
                            </div>
                            <button onClick={() => removeFromCart(item.cartItemId)} className="p-2 hover:bg-zinc-800 text-zinc-500 hover:text-red-500 rounded transition"><X size={18}/></button>
                          </div>
                          {(item.removedIngredients.length > 0 || item.addOns.length > 0 || item.note) && (
                            <div className="text-xs text-zinc-400 pl-14 space-y-1">
                               {item.removedIngredients.map(ing => <p key={ing} className="text-red-400 flex items-center gap-1"><Minus size={10}/> Sem {STOCK_NAMES[ing] || ing}</p>)}
                               {item.addOns.map(add => <p key={add.id} className="text-green-400 flex items-center gap-1"><Plus size={10}/> {add.qty}x {add.name}</p>)}
                               {item.note && <p className="text-zinc-500 italic">" {item.note} "</p>}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <form id="checkout-form" onSubmit={handleFinishAndWhatsApp} className="space-y-5">
                      <div><label className="block text-xs font-bold text-zinc-500 uppercase mb-1 ml-1">Seu Nome</label><div className="flex items-center bg-zinc-950 border border-zinc-800 rounded-xl px-4 focus-within:border-yellow-500 transition"><User size={18} className="text-zinc-500" /><input required type="text" className="w-full bg-transparent py-4 pl-3 outline-none text-white placeholder-zinc-700" placeholder="Como te chamamos?" value={customerName} onChange={e => setCustomerName(e.target.value)} /></div></div>
                      <div><label className="block text-xs font-bold text-zinc-500 uppercase mb-1 ml-1">Telefone / Whats</label><div className="flex items-center bg-zinc-950 border border-zinc-800 rounded-xl px-4 focus-within:border-green-500 transition"><Phone size={18} className="text-zinc-500" /><input required type="tel" className="w-full bg-transparent py-4 pl-3 outline-none text-white placeholder-zinc-700" placeholder="(00) 00000-0000" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} /></div></div>
                      
                      <div>
                        <label className="block text-xs font-bold text-zinc-500 uppercase mb-1 ml-1">Endereço de Entrega *</label>
                        <div className="space-y-3">
                          <div className="flex gap-3">
                            <div className="relative flex-1">
                              <div className="flex items-center bg-zinc-950 border border-zinc-800 rounded-xl px-4 focus-within:border-yellow-500 transition">
                                <MapPin size={18} className="text-zinc-500 mr-2 shrink-0" />
                                <input required type="text" className="w-full bg-transparent py-3.5 outline-none text-white placeholder-zinc-700" placeholder="CEP (Apenas Números)" value={cep} onChange={onCepChange} maxLength={9} />
                              </div>
                              {fetchingCep && <div className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin"></div>}
                            </div>
                            <div className="w-1/3">
                              <div className="flex items-center bg-zinc-950 border border-zinc-800 rounded-xl px-4 focus-within:border-yellow-500 transition">
                                <input required id="addressNumber" type="text" className="w-full bg-transparent py-3.5 outline-none text-white placeholder-zinc-700" placeholder="Nº" value={number} onChange={e => setNumber(e.target.value)} />
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center bg-zinc-950 border border-zinc-800 rounded-xl px-4 focus-within:border-yellow-500 transition">
                            <input required type="text" className="w-full bg-transparent py-3.5 outline-none text-white placeholder-zinc-700" placeholder="Sua Rua / Avenida" value={street} onChange={e => setStreet(e.target.value)} />
                          </div>
                          
                          <div className="flex gap-3">
                            <div className="flex-1 flex items-center bg-zinc-950 border border-zinc-800 rounded-xl px-4 focus-within:border-yellow-500 transition">
                              <input required type="text" className="w-full bg-transparent py-3.5 outline-none text-white placeholder-zinc-700" placeholder="Bairro" value={neighborhood} onChange={e => setNeighborhood(e.target.value)} />
                            </div>
                            <div className="flex-1 flex items-center bg-zinc-950 border border-zinc-800 rounded-xl px-4 focus-within:border-yellow-500 transition">
                              <input type="text" className="w-full bg-transparent py-3.5 outline-none text-white placeholder-zinc-700" placeholder="Complemento" value={complement} onChange={e => setComplement(e.target.value)} />
                            </div>
                          </div>
                        </div>
                      </div>

                      <div><label className="block text-xs font-bold text-zinc-500 uppercase mb-1 ml-1">Pagamento</label><div className="grid grid-cols-3 gap-3">{['pix', 'dinheiro', 'cartão'].map(method => (<button key={method} type="button" onClick={() => setPaymentMethod(method)} className={`py-3 rounded-xl text-sm font-bold capitalize border transition ${paymentMethod === method ? 'bg-yellow-600 text-black border-yellow-500 shadow-lg' : 'bg-zinc-950 text-zinc-500 border-zinc-800 hover:border-zinc-700'}`}>{method}</button>))}</div></div>
                      <div><label className="block text-xs font-bold text-zinc-500 uppercase mb-1 ml-1">Observações Gerais</label><textarea rows={2} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-white placeholder-zinc-700 outline-none resize-none focus:border-yellow-500 transition" placeholder="Troco para 50, campainha não funciona..." value={orderNote} onChange={e => setOrderNote(e.target.value)} /></div>
                    </form>
                  )}
                </>
              )}
            </div>

            {cart.length > 0 && (
              <div className="p-6 border-t border-zinc-800 bg-zinc-900 rounded-b-3xl">
                <div className="flex justify-between items-center mb-3 text-sm"><span className="text-zinc-400">Subtotal</span><span className="font-bold text-zinc-200">{formatCurrency(cartTotal)}</span></div>
                {checkoutStep === 'form' && (<div className="flex justify-between items-center mb-4 text-sm"><span className="text-zinc-400">Taxa de Entrega</span><span className="font-bold text-yellow-500">{formatCurrency(deliveryFee)}</span></div>)}
                <div className="flex justify-between items-center mb-6 text-2xl font-bold text-white"><span>Total</span><span>{formatCurrency(cartTotal + (checkoutStep === 'form' ? deliveryFee : 0))}</span></div>
                {checkoutStep === 'cart' ? (
                  <button onClick={() => setCheckoutStep('form')} className="w-full bg-yellow-600 text-black font-bold py-4 rounded-xl hover:bg-yellow-500 transition flex items-center justify-center gap-2 shadow-lg shadow-yellow-600/10 active:scale-95 text-lg">Continuar para Entrega</button>
                ) : (
                  <button type="submit" form="checkout-form" disabled={loading} className="w-full bg-green-600 text-white font-bold py-4 rounded-xl hover:bg-green-500 transition flex items-center justify-center gap-3 shadow-lg shadow-green-600/20 active:scale-95 text-lg disabled:opacity-50 disabled:scale-100">{loading ? 'Processando...' : <><MessageCircle size={24} /> Finalizar e Enviar no WhatsApp</>}</button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
      
      <div className="h-16"></div>
    </div>
  );
}