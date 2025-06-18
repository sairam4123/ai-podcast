
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);


export const isSignedIn = async () => {
    const session = await supabase.auth.getSession();
    return session.data.session !== null;
}

export const getToken = async () => {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) {
        console.error("Error getting session:", error);
        return null;
    }
    if (session) {
        return session.access_token;
    }
    return null;
};

export const getUser = async () => {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) {
        console.error("Error getting user:", error);
        return null;
    }
    return user;
};