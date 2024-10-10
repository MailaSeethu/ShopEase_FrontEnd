import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, catchError, Observable, tap, throwError } from 'rxjs';
import { Buy } from '../Models/Buy';
import { Cart } from '../Models/Cart';

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private cartItems: any[] = []; // Replace `any` with your product type
  private cartItemCount = new BehaviorSubject<number>(0); // Default to 0 if no count in localStorage

  initialvalue: Buy = new Buy();
  checkoutarray = Array();
  constructor(private http: HttpClient) {
    this.loadCartCountFromLocalStorage();
  }

  Add(cart: Cart): Observable<Cart> {
    console.log(cart);
    return this.http.post<Cart>("https://localhost:7025/api/Carts/", cart).pipe(
      tap((response: Cart) => {
        this.updateCartCount(1); // Increment cart count on success
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('Error adding to cart:', error.message); // Inline error log
        return throwError(() => new Error('Failed to add item to cart, please try again.'));
      })
    );
  }

  Get(): Observable<Cart[]> {
    return this.http.get<Cart[]>("https://localhost:7025/api/Carts");
  }

  Delete(id: number,quantity:number): Observable<Cart> {
    const name = localStorage.getItem('userName') as string;
    console.log(id);
    console.log(name);
    console.log("https://localhost:7025/api/Carts/delete?username=" + name + "&id=" + id);
    return this.http.delete<Cart>("https://localhost:7025/api/Carts/delete?username=" + name + "&id=" + id).pipe(
      tap(() => {
        var qty = -Math.abs(quantity);
        console.log("quantity while deleting",qty)
        this.updateCartCount(qty); // Decrement cart count on delete
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('Error deleting from cart:', error.message); // Inline error log
        return throwError(() => new Error('Failed to delete item from cart, please try again.'));
      })
    );
  }

  UpdateQuantity(index: number, value: number): Observable<void> {
    const name = localStorage.getItem('userName') as string;

    return this.http.put<void>(
      `https://localhost:7025/api/Carts?username=${name}&index=${index}&value=${value}`,
      { body: name } // Include body if necessary, but this seems odd
    ).pipe(
      tap(() => {
        if (value < 0) {
          
          this.updateCartCount(-1); // Decrease count when value is negative
        } else {
          this.updateCartCount(1); // Increase count when value is positive
        }
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('Error updating cart quantity:', error.message); // Inline error log
        return throwError(() => new Error('Failed to update item quantity, please try again.'));
      })
    );
  }

  CheckOut() {
    console.log(this.checkoutarray);
    const a = JSON.parse(localStorage.getItem('checkout') as string);

    this.checkoutarray.push(a);
    localStorage.setItem('checkoutarray', JSON.stringify(this.checkoutarray));
  }

  GetCheckOut() {
    const b = JSON.parse(localStorage.getItem('checkoutarray') as string);
    console.log(b);
    return Object.assign({}, b);
  }

  // Method to add item to cart
  addToCart(product: any) {
    this.cartItems.push(product);
    this.updateCartCount(this.cartItems.length);
  }

  // Method to get the current count of items in the cart
  getCartItemCount() {
    return this.cartItemCount.asObservable();
  }

  // Method to load the cart count from localStorage
  private loadCartCountFromLocalStorage() {
    const savedCount = JSON.parse(localStorage.getItem('cartcount') as string);

    // Debugging logs
    console.log("Loaded cart count from localStorage:", savedCount);

    if (savedCount !== null && savedCount !== undefined) {
      this.cartItemCount.next(savedCount); // Set the saved count if it exists
    } else {
      console.log("No cart count found in localStorage, using default 0");
    }
  }

  // Method to update both the BehaviorSubject and localStorage
  private updateCartCount(change: number) {
    const currentCount = this.cartItemCount.getValue(); // Get the current count
    const newCount = currentCount + change; // Calculate new count based on the change parameter
    this.cartItemCount.next(newCount); // Notify subscribers
    localStorage.setItem('cartcount', JSON.stringify(newCount)); // Save count in localStorage

    // Debugging logs
    console.log("Updated cart count in localStorage:", newCount);
  }
  
}
