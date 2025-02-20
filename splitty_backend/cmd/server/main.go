package main

import (
	"fmt"
	"context"
	"log"
	"net/http"
	"connectrpc.com/connect"
	"golang.org/x/net/http2"
	"golang.org/x/net/http2/h2c"
	// "github.com/jackc/pgx/v5"
	// "github.com/jackc/pgx/v5/pgtype"
	"time"
	"github.com/golang-jwt/jwt/v5"
	"os"
    "github.com/joho/godotenv"
	"github.com/jackc/pgx/v5/pgxpool"
	"golang.org/x/crypto/bcrypt"
	"github.com/kussshhhh/splitty/splitty_backend/db/sqlc"	
	splittyv1 "github.com/kussshhhh/splitty/splitty_backend/gen/splitty/v1"
	"github.com/kussshhhh/splitty/splitty_backend/gen/splitty/v1/v1connect"
)

type SplittyServer struct{
	queries *db.Queries 
}

var dbPool *pgxpool.Pool 

type User struct {
	UserId string
	Email string
	PasswordHash string
}



var users = make(map[string]*User)
var jwtkey []byte
func init(){
	err := godotenv.Load()
    if err != nil {
        log.Printf("env not loaded error: %v", err)
    }
	jwtkey = []byte(os.Getenv("KEY"))
}

func generateJWT(userID string) (string, error) {
	claims := jwt.MapClaims{
		"user_id": userID,
		"exp":     time.Now().Add(time.Hour * 24).Unix(), // Token expires in 24 hours
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(jwtkey)
}

func(s *SplittyServer) Signup(
	ctx context.Context,
	req *connect.Request[splittyv1.SignupRequest],
) (*connect.Response[splittyv1.SignupResponse], error) {
	email := req.Msg.Email
	password := req.Msg.Password
	log.Println("recieved signup request for email: %s", email) ;

	hashed, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if(err != nil){
		return nil, connect.NewError(
			connect.CodeInternal,
			fmt.Errorf("failed to hash: %v", err),
		)
	}
	params := db.CreateUserParams{
		Email:        email,
		PasswordHash: string(hashed),
	}
	userId, err := s.queries.CreateUser(ctx, params)
	
	if(err != nil){
		return nil, connect.NewError(
				connect.CodeAlreadyExists,
				fmt.Errorf("error: %v", err),
		)
	}
	response := &splittyv1.SignupResponse{
		UserId: userId.String(),
	}
	return connect.NewResponse(response), nil
}

func(s *SplittyServer) Login(
	ctx context.Context,
	req *connect.Request[splittyv1.LoginRequest],
) (*connect.Response[splittyv1.LoginResponse], error) {
	email := req.Msg.Email
	password := req.Msg.Password
	log.Printf("recieved login request email: %s", email) ;

	user, err := s.queries.GetUserByEmail(ctx, email)
	if(err != nil){
		return nil, connect.NewError(
			connect.CodeNotFound,
			fmt.Errorf("user not found error: %v", err),
		)
	}

	err = bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(password))
	if err != nil {
		return nil, connect.NewError(
			connect.CodeUnauthenticated,
			fmt.Errorf("invalid credentials"),
		)
	}

	token, err := generateJWT(user.UserID.String())
	if(err != nil){
		return nil, connect.NewError(
			connect.CodeInternal,
			fmt.Errorf("failer to generate token"),
		)
	}

	response := &splittyv1.LoginResponse{
		JwtToken: token, // logic
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
	
	response.Tax = &splittyv1.ReceiptAnalyzeResponse_TaxNa{
		TaxNa: true,
	}
	
	response.Tip = &splittyv1.ReceiptAnalyzeResponse_TipNa{
		TipNa: true,
	}
	
	response.AdditionalCharges = &splittyv1.ReceiptAnalyzeResponse_AdditionalChargesNa{
		AdditionalChargesNa: true,
	}
	
	return connect.NewResponse(response), nil
}

func main(){
	
	dbPassword := os.Getenv("DB_PASSWORD")
	dburl := "postgresql://postgres:" + dbPassword + "@localhost:5432/splitty?sslmode=disable"
	// var err error
	dbPool, err := pgxpool.New(context.Background(), dburl) 
	if(err != nil){
		log.Fatalf("Unable to connect to db error: %v", err)
	}
	defer dbPool.Close() 

	queries := db.New(dbPool)


	server := &SplittyServer{queries: queries} 

	path, handler := v1connect.NewSplittyServiceHandler(server)

	mux := http.NewServeMux() 
	mux.Handle(path, handler) 

	address := ":8080"
	log.Printf("server running on %s", address) ;
	err = http.ListenAndServe(
		address,
		h2c.NewHandler(mux, &http2.Server{}),
	)
	if err != nil {
		log.Fatalf("server failed: %v", err) ;
	}
}