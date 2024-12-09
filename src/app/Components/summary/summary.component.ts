
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Address } from 'src/app/Models/Address';
import { Buy } from 'src/app/Models/Buy';
import { Products } from 'src/app/Models/Products';
import { AddressService } from 'src/app/Services/address.service';
import { BuyService } from 'src/app/Services/buy.service';
import { CartService } from 'src/app/Services/cart.service';
import { ProductsServiceService } from 'src/app/Services/products-service.service';
import { Location } from '@angular/common';
import confetti from 'canvas-confetti';
import { Couponcode } from 'src/app/Models/Couponcode';
import { ToastrService } from 'ngx-toastr';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-summary',
  templateUrl: './summary.component.html',
  styleUrls: ['./summary.component.css']
})
export class SummaryComponent implements OnInit {

  addresses: Address[];
  selectedaddress: number = 0;
  buy: Buy[];
  FinalOrderPlace: Buy = new Buy();
  length: number;
  TotalPrice: number = 0;
  GrandTotal: number = 0;
  DiscountPrice: number = 0;
  Deliveryfee: number = 0;
  productsstatus: Products = new Products();
  date = new Date();
  promoCode: string = '';
  TaxAmount: number = 0;

  Products = Array();
  NoofItemsSelected = Array();
  promoCodes: Couponcode[]
  selectedPromoCode: string | null = null;
  promoDescription: string | null = null;
  userName = localStorage.getItem('userName') as string;

  constructor(private addressservice: AddressService, private cartservice: CartService,
    private buyservice: BuyService, private productservice: ProductsServiceService,
    private router: Router, private location: Location, private toastr: ToastrService,
    private snackBar: MatSnackBar) {

  }

  ngOnInit(): void {
    this.getCouponCodes()
    this.GetAllAddresses();
    this.GetCheckout();
    this.TotalProducts();
    this.TotalPrice = 0;
    this.DiscountPrice = 0;
    this.selectedaddress = JSON.parse(localStorage.getItem('addressid') as string);
    //this.calculateTax();

  }

  cardDetails = {
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardHolderName: ''
  };

  formatCardNumber() {
    this.cardDetails.cardNumber = this.cardDetails.cardNumber
      .replace(/\D/g, '') // Remove non-digit characters
      .replace(/(\d{4})/g, '$1 ') // Add space after every 4 digits
      .trim(); // Remove trailing space
  }

  validateAndProceed() {
    const { cardNumber, expiryDate, cvv, cardHolderName } = this.cardDetails;
    if (!cardNumber || cardNumber.length !== 19) {
      this.openSnackBar('Invalid Card Number. Please enter a valid 16-digit card number.', 3000);
      return;
    }

    if (!expiryDate || !/^(0[1-9]|1[0-2])\/\d{2}$/.test(expiryDate)) {
      this.openSnackBar('Invalid Expiry Date. Format should be MM/YY.', 3000);
      return;
    }

    if (!cvv || cvv.length !== 3) {
      this.openSnackBar('Invalid CVV. Please enter a 3-digit CVV.', 3000);
      return;
    }

    if (!cardHolderName || cardHolderName.trim().length < 3) {
      this.openSnackBar('Invalid Cardholder Name. Please enter a valid name.', 3000);
      return;
    }

    // this.openSnackBar('Card details saved successfully!', 3000);
    this.PlaceOrder();
  }


  openSnackBar(message: string, time: number) {
    this.snackBar.open(message, 'Close', {
      duration: time,
      panelClass: ['warning-snackbar']
    });
  }
  getCouponCodes() {
    this.buyservice.GetCoupons().subscribe((r) => {
      this.promoCodes = r
      this.buyservice.isFirstOrder(this.userName).subscribe((res) => {
        console.log('isFirstOrder', res)
        this.promoCodes.filter(x => x.couponcode == 'SAVE10')[0].isApplicable = res
      })
    })
  }

  triggerConfetti() {
    const duration = 3 * 1000; // 3 seconds
    const end = Date.now() + duration;

    (function frame() {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0 }
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1 }
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    }());
  }

  goback() {
    this.location.back();
  }
  GetAllAddresses() {
    this.addressservice.GetData().subscribe((result) => {
      this.addresses = result;
    })
  }
  AddressSelect(addressid: number) {
    this.selectedaddress = addressid;
  }

  GetCheckout() {
    this.buy = this.cartservice.GetCheckOut()
    this.GetOrderedProducts();
  }
  GetOrderedProducts() {
    this.productservice.GetProducts().subscribe((res) => {
      this.length = Object.keys(this.buy).length;
      for (var i = 0; i < this.length; i++) {
        let a = res.filter(x => x.productId == parseInt(this.buy[i].productId))
        this.Products.push(a[0]);
        this.NoofItemsSelected.push(parseInt(this.buy[i].noOfItems));
      }
    })
  }

  onPromoCodeChange() {
    const selectedPromo = this.promoCodes.find(promo => promo.couponcode === this.selectedPromoCode);
    if (selectedPromo) {
      this.promoDescription = selectedPromo.description;
    } else {
      this.promoDescription = null;
    }
  }

  applyPromoCode() {
    if (this.selectedPromoCode) {
      const selectedPromo = this.promoCodes.find(promo => promo.couponcode === this.selectedPromoCode);

      if (selectedPromo) {
        if (!selectedPromo.isApplicable) {
          this.selectedPromoCode = null;
          this.openSnackBar('This promo code is not applicable to your order.', 3000);
          return;
        }

        switch (this.selectedPromoCode.toUpperCase()) {
          case 'SHOPEASE20':
            if (this.TotalPrice >= 50) {
              this.DiscountPrice = 20;
              this.GrandTotal = this.TotalPrice - this.DiscountPrice;
              this.triggerConfetti();
              this.calculateTax();
            } else {
              this.selectedPromoCode = null;
              this.openSnackBar('The total value of cart items applicable for this coupon should be more than Rs.50.', 5000);
            }
            break;
          case 'SUMMERSALE':
            this.DiscountPrice = Math.round(this.TotalPrice * 0.25);
            this.GrandTotal = Math.round(this.TotalPrice * 0.75);
            this.triggerConfetti();
            this.calculateTax();
            break;
          case 'FREESHIP':
            if (this.Deliveryfee > 0 && this.TotalPrice > 50) {
              this.GrandTotal = this.TotalPrice - this.Deliveryfee;
              this.Deliveryfee = 0;
              this.triggerConfetti();
              this.calculateTax();
            } else if (this.Deliveryfee == 0 && this.TotalPrice > 50) {
              this.selectedPromoCode = null;
              this.openSnackBar('Offer already applied', 3000);
              this.triggerConfetti();
            }
            break;
          case 'SAVE10':
            if (this.TotalPrice >= 50) {
              this.DiscountPrice = 10;
              this.GrandTotal = this.TotalPrice - this.DiscountPrice;
              this.triggerConfetti();
              this.calculateTax();
            } else {
              this.selectedPromoCode = null;
              let remainingtoadd = 50 - this.TotalPrice;
              this.openSnackBar(`Shop for ${remainingtoadd} more to avail this offer.`, 4000);
            }
            break;
          case 'BUY2GET50OFF':
            this.applyBuy2Get50Off();
            break;
          default:
            this.openSnackBar('Invalid promo code', 3000);
        }

        this.DiscountPrice = Math.round(this.DiscountPrice);
        this.GrandTotal = Math.round(this.GrandTotal);



      }
    } else {
      this.openSnackBar('Please select a valid promo code - Invalid Coupon code', 5000);
    }
  }
  applyBuy2Get50Off() {
    let sum = this.NoofItemsSelected.reduce((accumulator, currentValue) => {
      return accumulator + currentValue;
    }, 0);
    console.log(sum)
    const itemCounts = this.NoofItemsSelected.reduce((acc, count) => acc + count, 0);
    if (sum >= 3) {
      const sortedProducts = this.Products.slice().sort((a, b) => a.productPrice - b.productPrice);
      const thirdCheapest = sortedProducts[sortedProducts.length - 1];
      if (thirdCheapest) {
        const discount = thirdCheapest.productPrice * 0.5;
        this.DiscountPrice = Math.round(discount);
        this.GrandTotal = Math.round(this.TotalPrice - discount);
        this.triggerConfetti();
        this.calculateTax();
      }
    } else {
      this.selectedPromoCode = null;
      this.openSnackBar('You need to buy at least 3 items to avail this offer', 4000)
    }
  }

  calculateTax() {
    const taxRate = 0.10; // 10% tax rate
    // Ensure the tax is calculated on the final GrandTotal after all discounts and adjustments
    this.TaxAmount = Math.round(this.GrandTotal * taxRate);
    this.GrandTotal += this.TaxAmount;
    this.GrandTotal += this.Deliveryfee;
  }


  PlaceOrder() {
    let user = localStorage.getItem('userName') as string;
    let currentDateTime = new Date();

    this.length = Object.keys(this.buy).length;
    this.FinalOrderPlace.addressId = this.selectedaddress;
    this.FinalOrderPlace.userName = user;
    this.FinalOrderPlace.status = 0;
    this.FinalOrderPlace.statusTime = currentDateTime;
    this.FinalOrderPlace.orderPlacedTime = currentDateTime;
    this.FinalOrderPlace.orderid = "orderid";
    this.FinalOrderPlace.productId = "";
    this.FinalOrderPlace.noOfItems = "";
    this.FinalOrderPlace.totalPrice = this.GrandTotal;
    for (var i = 0; i < this.length; i++) {
      this.FinalOrderPlace.totalPrice = this.GrandTotal;
      this.FinalOrderPlace.productId += this.buy[i].productId;
      this.FinalOrderPlace.noOfItems += this.buy[i].noOfItems;
      if (i != this.length - 1) {
        this.FinalOrderPlace.productId += ",";
        this.FinalOrderPlace.noOfItems += ",";
      }
    }
    this.myFunction(this.FinalOrderPlace, this.length, this.buy);
  }

  async myFunction(finalorder: Buy, len: number, b: Buy[]) {
    this.FinalOrderPlace = finalorder;
    this.length = len;
    this.buy = b;

    await this.buyservice.AddData(this.FinalOrderPlace).toPromise();

    for (var i = 0; i < this.length; i++) {
      let check = false;
      this.productsstatus.noofstocks = parseInt(this.buy[i].noOfItems);
      this.productsstatus.productId = parseInt(this.buy[i].productId);

      await this.productservice.UpdateStock(this.productsstatus).toPromise();
      const res = await this.cartservice.Delete(this.productsstatus.productId, this.productsstatus.noofstocks).toPromise();
      // this.cartservice.ClearCartCount()

      if (res && res.productId == this.productsstatus.productId) {
        check = true;
      }

      while (!check) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    this.selectedaddress = 0;
    this.buy = Array();
    this.TotalPrice = 0;
    localStorage.setItem('tempproductids', JSON.stringify(this.buy));
    this.router.navigate(['myorders']);
  }

  TotalProducts() {
    // Retrieve cart items
    this.buy = this.cartservice.GetCheckOut();
    console.log("cartservice", this.buy);
    this.length = Object.keys(this.buy).length;

    let NumberOfProducts = 0; // Initializing the number of products

    
    for (let i = 0; i < this.length; i++) {
      let id = parseInt(this.buy[i].productId);
      let noofitems = parseInt(this.buy[i].noOfItems);
      NumberOfProducts += noofitems; 

      // Fetch product details and calculate total price
      this.productservice.GetProducts().subscribe((result) => {
        let prodarray = result.filter(x => x.productId == id);
        console.log("price", prodarray);

        // Calculate the total price for the current product
        this.TotalPrice += prodarray[0].productPrice * noofitems;
        this.GrandTotal = this.TotalPrice;


        if (NumberOfProducts >= 10) {
          this.Deliveryfee = 0; // Free shipping for more than 10 products
        } else if (NumberOfProducts >= 5 && NumberOfProducts < 10) {
          this.Deliveryfee = (this.TotalPrice * 0.05); // 5% of the total price if between 5 and 9 products
        } else if (NumberOfProducts >= 1 && NumberOfProducts <= 4) {
          this.Deliveryfee = (this.TotalPrice * 0.10); // 10% of the total price if between 1 and 4 products
        }

        // Round the delivery fee to 2 decimal places
        this.Deliveryfee = parseFloat(this.Deliveryfee.toFixed(2));


        console.log("Delivery Fee: ", this.Deliveryfee);

        // Recalculating  tax based on the updated GrandTotal
        this.calculateTax();
      });
    }

    // Seting  the delivery time to 15 minutes from now
    this.date.setMinutes(this.date.getMinutes() + 15);
  }

  ProductDetails(pid: number) {
    this.productservice.updateproductid(pid);
    let a = "productdetails";
    localStorage.setItem('pdetails', a)
    this.router.navigate(['productdetails']);
  }
}

