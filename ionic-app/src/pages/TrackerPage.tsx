import React, { useState } from 'react';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonFab,
  IonFabButton,
  IonIcon,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonItem,
  IonLabel,
  IonInput,
  IonButton,
  IonList,
  IonSpinner,
  IonToast,
  IonSelect,
  IonSelectOption,
  IonGrid,
  IonRow,
  IonCol,
  IonRefresher,
  IonRefresherContent,
} from '@ionic/react';
import { camera, search, add, trash } from 'ionicons/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../services/AuthService';
import apiService from '../services/ApiService';
import CameraModal from '../components/CameraModal';

const TrackerPage: React.FC = () => {
  const { sessionId } = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showCamera, setShowCamera] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedFood, setSelectedFood] = useState<any>(null);
  const [quantity, setQuantity] = useState(1);
  const [unit, setUnit] = useState('');
  const [unitOptions, setUnitOptions] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const queryClient = useQueryClient();

  // Fetch meals for selected date
  const { data: meals = [], isLoading: mealsLoading, refetch: refetchMeals } = useQuery({
    queryKey: ['meals', sessionId, selectedDate],
    queryFn: () => apiService.getMeals(sessionId, selectedDate),
  });

  // Fetch daily summary
  const { data: dailySummary } = useQuery({
    queryKey: ['dailySummary', sessionId, selectedDate],
    queryFn: () => apiService.getDailySummary(sessionId, selectedDate),
  });

  // Add meal mutation
  const addMealMutation = useMutation({
    mutationFn: (mealData: any) => apiService.addMeal(mealData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meals', sessionId, selectedDate] });
      setSelectedFood(null);
      setQuantity(1);
      setUnit('');
      setSearchQuery('');
      setSearchResults([]);
      showToastMessage('Food added successfully!');
    },
    onError: () => {
      showToastMessage('Failed to add food');
    },
  });

  // Remove meal mutation
  const removeMealMutation = useMutation({
    mutationFn: (id: number) => apiService.removeMeal(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meals', sessionId, selectedDate] });
      showToastMessage('Food removed');
    },
  });

  // Submit daily summary mutation
  const submitSummaryMutation = useMutation({
    mutationFn: (summaryData: any) => apiService.submitDailySummary(summaryData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dailySummary', sessionId, selectedDate] });
      apiService.clearMeals(sessionId, selectedDate);
      queryClient.invalidateQueries({ queryKey: ['meals', sessionId, selectedDate] });
      showToastMessage('Meal submitted successfully!');
    },
  });

  const searchFood = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    try {
      const results = await apiService.searchFood(searchQuery, sessionId);
      setSearchResults(results);
    } catch (error) {
      showToastMessage('Search failed');
    } finally {
      setIsSearching(false);
    }
  };

  const selectFood = async (food: any) => {
    setSelectedFood(food);
    setQuantity(1);
    
    try {
      const units = await apiService.getUnitSelection(food.name);
      setUnitOptions(units);
      setUnit(units[0] || 'serving');
    } catch (error) {
      setUnitOptions(['serving', 'grams', 'cup']);
      setUnit('serving');
    }
  };

  const addSelectedFood = () => {
    if (!selectedFood) return;

    const mealData = {
      sessionId,
      date: selectedDate,
      foodId: selectedFood.id,
      foodName: selectedFood.name,
      quantity,
      unit,
      calories: Math.round(selectedFood.calories * quantity),
      protein: Math.round(selectedFood.protein * quantity * 10) / 10,
      carbs: Math.round(selectedFood.carbs * quantity * 10) / 10,
      fat: Math.round(selectedFood.fat * quantity * 10) / 10,
    };

    addMealMutation.mutate(mealData);
  };

  const submitMeal = () => {
    if (meals.length === 0) {
      showToastMessage('Add some foods first');
      return;
    }

    const totalCalories = meals.reduce((sum, meal) => sum + (meal.calories || 0), 0);
    const totalProtein = meals.reduce((sum, meal) => sum + (meal.protein || 0), 0);
    const totalCarbs = meals.reduce((sum, meal) => sum + (meal.carbs || 0), 0);
    const totalFat = meals.reduce((sum, meal) => sum + (meal.fat || 0), 0);

    const summaryData = {
      sessionId,
      date: selectedDate,
      totalCalories,
      totalProtein,
      totalCarbs,
      totalFat,
      caloriesBurned: dailySummary?.caloriesBurned || 0,
    };

    submitSummaryMutation.mutate(summaryData);
  };

  const showToastMessage = (message: string) => {
    setToastMessage(message);
    setShowToast(true);
  };

  const handleRefresh = async (event: CustomEvent) => {
    await refetchMeals();
    event.detail.complete();
  };

  const totalCalories = meals.reduce((sum, meal) => sum + (meal.calories || 0), 0);
  const totalProtein = meals.reduce((sum, meal) => sum + (meal.protein || 0), 0);
  const totalCarbs = meals.reduce((sum, meal) => sum + (meal.carbs || 0), 0);
  const totalFat = meals.reduce((sum, meal) => sum + (meal.fat || 0), 0);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Food Tracker</IonTitle>
        </IonToolbar>
      </IonHeader>
      
      <IonContent>
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent />
        </IonRefresher>

        {/* Date Selector */}
        <IonCard>
          <IonCardContent>
            <IonItem>
              <IonLabel position="stacked">Date</IonLabel>
              <IonInput
                type="date"
                value={selectedDate}
                onIonInput={(e) => setSelectedDate(e.detail.value!)}
              />
            </IonItem>
          </IonCardContent>
        </IonCard>

        {/* Food Search */}
        <IonCard>
          <IonCardHeader>
            <IonCardTitle>Search Food</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <IonItem>
              <IonLabel position="stacked">Food Name</IonLabel>
              <IonInput
                value={searchQuery}
                onIonInput={(e) => setSearchQuery(e.detail.value!)}
                placeholder="e.g., rice, chicken, apple"
              />
            </IonItem>
            <IonButton 
              expand="block" 
              onClick={searchFood}
              disabled={isSearching || !searchQuery.trim()}
              className="search-button"
            >
              {isSearching ? <IonSpinner /> : <IonIcon icon={search} />}
              {isSearching ? 'Searching...' : 'Search'}
            </IonButton>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <IonList>
                {searchResults.map((food, index) => (
                  <IonItem 
                    key={index} 
                    button 
                    onClick={() => selectFood(food)}
                    color={selectedFood?.id === food.id ? 'primary' : undefined}
                  >
                    <IonLabel>
                      <h3>{food.name}</h3>
                      <p>{food.calories} cal | {food.protein}g protein</p>
                    </IonLabel>
                  </IonItem>
                ))}
              </IonList>
            )}

            {/* Selected Food Details */}
            {selectedFood && (
              <div style={{ marginTop: '20px' }}>
                <h3>{selectedFood.name}</h3>
                <IonGrid>
                  <IonRow>
                    <IonCol size="6">
                      <IonItem>
                        <IonLabel position="stacked">Quantity</IonLabel>
                        <IonInput
                          type="number"
                          value={quantity}
                          onIonInput={(e) => setQuantity(parseInt(e.detail.value!) || 1)}
                        />
                      </IonItem>
                    </IonCol>
                    <IonCol size="6">
                      <IonItem>
                        <IonLabel position="stacked">Unit</IonLabel>
                        <IonSelect value={unit} onIonChange={(e) => setUnit(e.detail.value)}>
                          {unitOptions.map((option) => (
                            <IonSelectOption key={option} value={option}>
                              {option}
                            </IonSelectOption>
                          ))}
                        </IonSelect>
                      </IonItem>
                    </IonCol>
                  </IonRow>
                </IonGrid>
                
                <div style={{ padding: '10px 0' }}>
                  <p><strong>{Math.round(selectedFood.calories * quantity)} cal</strong></p>
                  <p>Protein: {Math.round(selectedFood.protein * quantity * 10) / 10}g</p>
                  <p>Carbs: {Math.round(selectedFood.carbs * quantity * 10) / 10}g</p>
                  <p>Fat: {Math.round(selectedFood.fat * quantity * 10) / 10}g</p>
                </div>

                <IonButton 
                  expand="block" 
                  onClick={addSelectedFood}
                  disabled={addMealMutation.isPending}
                >
                  {addMealMutation.isPending ? <IonSpinner /> : <IonIcon icon={add} />}
                  Add to Meal
                </IonButton>
              </div>
            )}
          </IonCardContent>
        </IonCard>

        {/* Current Meal Summary */}
        <IonCard>
          <IonCardHeader>
            <IonCardTitle>Current Meal</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            {mealsLoading ? (
              <IonSpinner />
            ) : meals.length === 0 ? (
              <p>No foods added yet</p>
            ) : (
              <>
                <IonList>
                  {meals.map((meal, index) => (
                    <IonItem key={index}>
                      <IonLabel>
                        <h3>{meal.foodName}</h3>
                        <p>{meal.quantity} {meal.unit} - {meal.calories} cal</p>
                      </IonLabel>
                      <IonButton 
                        fill="clear" 
                        color="danger"
                        onClick={() => removeMealMutation.mutate(meal.id)}
                      >
                        <IonIcon icon={trash} />
                      </IonButton>
                    </IonItem>
                  ))}
                </IonList>

                <div className="metric-card" style={{ marginTop: '20px' }}>
                  <h3>Meal Totals</h3>
                  <IonGrid>
                    <IonRow>
                      <IonCol size="6">
                        <div className="metric-value">{totalCalories}</div>
                        <div className="metric-label">Calories</div>
                      </IonCol>
                      <IonCol size="6">
                        <div className="metric-value">{totalProtein.toFixed(1)}g</div>
                        <div className="metric-label">Protein</div>
                      </IonCol>
                    </IonRow>
                    <IonRow>
                      <IonCol size="6">
                        <div className="metric-value">{totalCarbs.toFixed(1)}g</div>
                        <div className="metric-label">Carbs</div>
                      </IonCol>
                      <IonCol size="6">
                        <div className="metric-value">{totalFat.toFixed(1)}g</div>
                        <div className="metric-label">Fat</div>
                      </IonCol>
                    </IonRow>
                  </IonGrid>
                </div>

                <IonButton 
                  expand="block" 
                  onClick={submitMeal}
                  disabled={submitSummaryMutation.isPending}
                  style={{ marginTop: '20px' }}
                >
                  {submitSummaryMutation.isPending ? <IonSpinner /> : 'Submit Meal'}
                </IonButton>
              </>
            )}
          </IonCardContent>
        </IonCard>

        {/* Camera FAB */}
        <IonFab vertical="bottom" horizontal="end" slot="fixed">
          <IonFabButton onClick={() => setShowCamera(true)} className="camera-button">
            <IonIcon icon={camera} />
          </IonFabButton>
        </IonFab>

        {/* Camera Modal */}
        <CameraModal
          isOpen={showCamera}
          onClose={() => setShowCamera(false)}
          sessionId={sessionId}
          selectedDate={selectedDate}
        />

        {/* Toast */}
        <IonToast
          isOpen={showToast}
          message={toastMessage}
          duration={2000}
          onDidDismiss={() => setShowToast(false)}
        />
      </IonContent>
    </IonPage>
  );
};

export default TrackerPage;