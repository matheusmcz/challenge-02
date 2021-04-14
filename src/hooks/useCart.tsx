import { createContext, ReactNode, useContext, useState } from "react";
import { toast } from "react-toastify";
import { api } from "../services/api";
import { Product } from "../types";

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
    const storagedCart = localStorage.getItem("@Rocketseat:cart");

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const addProductCart = [...cart];
      const productExist = addProductCart.find(
        (product) => product.id === productId
      );
      const stock = await api.get(`/stock/${productId}`);
      const stockAmount = stock.data.amount;
      const productExistAmount = productExist ? productExist.amount + 1 : 0;

      if (productExistAmount > stockAmount) {
        toast.error("Quantidade solicitada fora de estoque");
        return;
      }

      if (productExist) {
        const newProductCart = addProductCart.map((product) => {
          if (product.id === productId) {
            return { ...product, amount: product.amount + 1 };
          } else {
            return product;
          }
        });

        setCart(newProductCart);
        localStorage.setItem(
          "@RocketShoes:cart",
          JSON.stringify(newProductCart)
        );
      } else {
        const product = await api.get(`/products/${productId}`);
        const newProduct = {
          ...product.data,
          amount: 1,
        };
        addProductCart.push(newProduct);
        setCart(addProductCart);
        localStorage.setItem(
          "@RocketShoes:cart",
          JSON.stringify(addProductCart)
        );
      }
    } catch {
      toast.error("Erro na adição do produto");
    }
  };

  const removeProduct = (productId: number) => {
    try {
      let removeProductCart = [...cart];
      const productExist = removeProductCart.find(
        (product) => product.id === productId
      );

      if (!productExist) {
        toast.error("Erro na remoção do produto");
        return;
      }

      if (productExist) {
        const productExistAmount =
          productExist && productExist.amount > 1 ? productExist.amount - 1 : 0;

        if (productExistAmount > 0) {
          productExist.amount = productExistAmount;
        } else {
          removeProductCart = removeProductCart.filter(
            (product) => product.id !== productExist.id
          );
        }

        setCart(removeProductCart);
        localStorage.setItem(
          "@RocketShoes:cart",
          JSON.stringify(removeProductCart)
        );
      }
    } catch {
      toast.error("Erro na remoção do produto");
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      const addProductCart = [...cart];
      const productExist = addProductCart.find(
        (product) => product.id === productId
      );

      if (productExist && amount <= 0) return;

      const stock = await api.get(`/stock/${productId}`);
      const stockAmount = stock.data.amount;

      if (amount > stockAmount) {
        toast.error("Quantidade solicitada fora de estoque");
        return;
      }

      const newProductCart = addProductCart.map((product) => {
        if (product.id === productId) {
          return { ...product, amount };
        } else {
          return product;
        }
      });

      setCart(newProductCart);

      localStorage.setItem("@RocketShoes:cart", JSON.stringify(newProductCart));
    } catch {
      toast.error("Erro na alteração de quantidade do produto");
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
