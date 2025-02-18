package main

import (
	"context"
	"log"
	"net/http"
	"github.com/bufbuild/connect-go"
	"golang.org/x/net/http2"
	"golang.org/x/net/http2/h2c"
	
	splittyv1 "github.com/kussshhhh/splitty/splitty_backend/gen/splitty/v1"
	"github.com/kussshhhh/splitty/splitty_backend/gen/splitty/v1/v1connect"
)

type SplittyServer struct()

func(s *SplittyServer) Signup(
	ctx context.Context,
	req *connect.Request[splittyv1.SignupRequest],
) (*connect.Response[splitty.v1.SignupResponse], error) {
	log.Printf("recieved signup request for email: %s" req.Msq.Email) ;

	response := &splittyv1.SignupResponse{
		UserId: "something" // logic
	}

	return connect.NewResponse(response), nil
}

func(s *SplittyServer) Login(
	ctx context.Context,
	req *connect.Request[splittyv1.LoginRequest],
) (*connect.Response[splittyv1.LoginResponse, error]) {
	log.Printf("recieved login request email: %s", req.Msg.Email) ;
	response := &splittyv1.LoginResponse{
		JwtToken: "random_token", // logic
		Valid: true,
	}

	return connect.NewResponse(response), nil

}

func (s *SplittyServer) ReceiptAnalyze(
	ctx context.Context,
	req *connect.Request[splittyv1.ReceiptAnalyzeRequest],
) (*connect.Response[splittyv1.ReceiptAnalyzeResponse], error) {
	log.Printf("Received receipt analyze request with %d bytes", len(req.Msg.Image))
	
	// Simple placeholder response
	response := &splittyv1.ReceiptAnalyzeResponse{
		ReceiptId: "receipt-123",
		Status: true,
		NameOfEstablishment: "Example Store",
		Currency: "USD",
		Items: []*splittyv1.ReceiptItem{
			{
				Name: "Example Item",
				Quantity: 1,
				PricePerItem: 9.99,
				TotalPrice: 9.99,
			},
		},
		NumberOfItems: 1,
		Subtotal: 9.99,
		Total: 9.99,
	}
	
	// Set tax as "not applicable" for now
	response.Tax = &splittyv1.ReceiptAnalyzeResponse_TaxNa{
		TaxNa: true,
	}
	
	// Set tip as "not applicable" for now
	response.Tip = &splittyv1.ReceiptAnalyzeResponse_TipNa{
		TipNa: true,
	}
	
	// Set additional charges as "not applicable" for now
	response.AdditionalCharges = &splittyv1.ReceiptAnalyzeResponse_AdditionalChargesNa{
		AdditionalChargesNa: true,
	}
	
	return connect.NewResponse(response), nil
}

func main(){
	server := &SplittyServer{} 

	path, handler := v1connect.NewSplittyServiceHandler(server)

	mux := http.NewServeMux() 
	mux.Handle(path, handler) 

	address := ":8080"
	log.Printf("server running on %s" address) ;
	err := http.ListenAndServe(
		address,
		h2c.NewHandler(mux, &http2.Server{}),
	)
	if err != nil {
		log.Fatalf("server failed: %v", err) ;
	}
}