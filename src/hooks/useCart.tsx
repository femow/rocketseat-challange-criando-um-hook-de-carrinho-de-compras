import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const _cart = cart.concat();
      const product = _cart.filter(p => p.id === productId)[0];
      const { data } = await api.get(`/stock/${productId}`)

      if(!data || (product ? data.amount < product.amount + 1 : data.amount === 0)) {
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }

      if(!product) {
        const { data } = await api.get(`/products/${productId}`);
        data.amount = 1;
        _cart.push(data);
      } else {
        product.amount++;
      }

      localStorage.setItem('@RocketShoes:cart', JSON.stringify(_cart));
      setCart(_cart);
    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const _cart = cart.concat();
      const product = _cart.filter(p => p.id === productId)[0];
      if(!product) {
        throw new Error('Produto não encontrado');
      }
      const productIndex = _cart.indexOf(product);
      if(productIndex === -1) {
        throw new Error('Index não encontrado');
      }
      _cart.splice(productIndex, 1);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(_cart));
      setCart(_cart);
    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    if(amount <= 0) {
      return;
    }
    try {
      const _cart = cart.concat();
      const product = _cart.filter(p => p.id === productId)[0];
      const { data } = await api.get(`/stock/${productId}`)
      if(!data || data.amount < amount || data.amount === 0) {
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }
      if(!product) {
        throw new Error('Erro na alteração de quantidade do produto')
      }
      product.amount = amount;
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(_cart));
      setCart(_cart);
    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
