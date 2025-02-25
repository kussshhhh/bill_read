import { createClient } from "@connectrpc/connect";
import { createConnectTransport } from "@connectrpc/connect-web";
import { SplittyService } from "../gen/splitty/v1/splitty_pb";``



const transport = createConnectTransport({
  baseUrl: "http://localhost:8080",  
});

export const splittyClient = createClient(SplittyService, transport);

function logResult(action: string, result: any, error: any = null) {
  console.log(`[${action}] Request Sent`);
  if (error) {
    console.error(`[${action}] Error:`, {
      message: error.message,
      code: error.code,
      metadata: error.metadata,
      raw: error, // Full error object
    });
  } else {
    console.log(`[${action}] Success:`, result);
  }
}

export async function signup(email: string, password: string) {
  try {
    console.log("signup request : ", { email, password });
    const response = await splittyClient.signup({ email, password });
    logResult("signup response: ", response);
    return response;
  } catch (error) {
    logResult("signup error: ", null, error);
    throw error;
  }
}

export async function login(email: string, password: string) {
  try {
    console.log("login request : ", { email, password });
    const response = await splittyClient.login({ email, password });
    logResult("login response : ", response);
    if (response.jwtToken) {
      localStorage.setItem('jwt_token', response.jwtToken);
      console.log("JWT token saved to localStorage");
    } else {
      console.warn("No JWT token received in login response");
    }
    return response;
  } catch (error) {
    logResult("login error: ", null, error);
    throw error;
  }
}


export async function receiptAnalyze(imageData: Uint8Array) {
  try {
    console.log("receiptAnalyze request: Image data size", imageData.length, "bytes");
    
    const token = localStorage.getItem('jwt_token');
    
    if (!token) {
      throw new Error("Authentication required. Please log in first.");
    }
    
    const headers = {
      'Authorization': `Bearer ${token}`
    };
    
    console.log("Sending request to receiptAnalyze endpoint with authentication...");
    
    const response = await splittyClient.receiptAnalyze(
      { image: imageData },
      { headers }
    );
    
    console.log("Successfully received response from receiptAnalyze");
    logResult("receiptAnalyze response: ", response);
    
    return response;
  } catch (error) {
    console.error("Error in receiptAnalyze:", error);
    
    logResult("receiptAnalyze error: ", null, error);
    throw error;
  }
}